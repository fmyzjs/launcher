var App = App || {};

App.API_ROOT = '/api/v1/';
App.pusher = new Pusher('3e3f5adc573b8ededb38');
App.INTERCOM_APP_ID = '';

// Models
App.Project = Backbone.Model.extend({});

App.ProjectList = Backbone.Collection.extend({
    model: App.Project,
    url: App.API_ROOT + 'projects/',
    parse: function(response) {
        return response.objects;
    }
});

App.Deployment = Backbone.Model.extend({
    url: App.API_ROOT + 'deployments/',
    validate: function(attrs, options) {
        var re = /\S+@\S+\.\S+/;
        if(attrs.email === "" || !re.test(attrs.email)) {
            return "You must enter an email address!";
        }
        if(attrs.email.length > 60) {
            return "You've entered an email address that is too long (>60 characters)";
        }
    }
});

// Views
App.DeployFormView = Backbone.View.extend({
    el: $('.container'),

    events: {
        "submit form.form-deploy": "deploy"
    },

    initialize: function() {
        this.projects = new App.ProjectList(apps);
        this.showEmbedButtons = this.projects.length === 1;
        var _this = this;
        _this.render();

    },

    render: function() {
        // detects if the app is running inside an iframe
        if ( window.self !== window.top ) {
            this.$el.addClass('iframe');
        }
        var data = {};
        if (this.projects.length > 1) {
            data['projects'] = this.projects.toJSON();
        }
        else {
            var project = this.projects.models[0];
            this.project = project;
            data['project'] = project;
        }
        var template = _.template($("#deploy_form_template").html(), data);
        this.$el.html(template);
        return this;
    },

    get_app_data: function() {
        var project = this.project || this.projects.findWhere({'resource_uri': this.$('select[name=project]').val()});
        return {
            'project_uri': project.get('resource_uri'),
            'app_name': project.get('name'),
            'survey_url': project.get('survey_form_url')
        };
    },

    deploy: function(e) {
        e.preventDefault();
        app_data = this.get_app_data();
        if (app_data.survey_url !== "") {
            window.open(app_data.survey_url, null, 'height=1204, width=680, toolbar=0, location=0, status=1, scrollbars=1, resizable=1');
        }
        var project_uri = app_data['project_uri'];
        var app_name = app_data['app_name'];
        var email = this.$('input[name=email]').val();
        // creates a deployment app name from the project name and random characters
        var deploy_id = app_name.toLowerCase() + Math.random().toString().substr(2,6);
        deploy_id = deploy_id.replace(/[. -]/g, '');
        app_data['deploy_id'] = deploy_id;

        // window.Intercom('boot', {
        //         app_id: App.INTERCOM_APP_ID,
        //         email: email,
        //         user_agent_data: navigator.userAgent
        //     }
        // );

        var deploy = new App.Deployment({
            project: project_uri,
            email: email,
            deploy_id: deploy_id
        });
        if(deploy.isValid()) {
            App.deployStatusView = new App.DeployStatusView(app_data);
            App.deployStatusView.render();
            deploy.save({}, {
                error: App.deployStatusView.deploymentFail
            });
        }
        else {
            this.$('div.form-group').addClass('has-error');
            var $errorMessage = $(".help-block");
            $errorMessage.text(deploy.validationError);
        }
    }

});

App.DeployStatusView = Backbone.View.extend({
    el: $(".container"),
    template: _.template($("#deploy_status_template").html()),
    initialize: function(app_data) {
        this.app_data = app_data;

        // Pusher channel
        this.channel = App.pusher.subscribe(this.app_data['deploy_id']);
        this.channel.bind('info_update', this.updateInfoStatus);
        this.channel.bind('deployment_complete', this.deploymentSuccess);
        this.channel.bind('deployment_failed', this.deploymentFail);
    },
    render: function(){
        var html = this.template(this.app_data);
        this.$el.html(html);
        //Intercom('update');
    },
    updateInfoStatus: function(data) {
        $("#info-message").text(data.message);
        $('.progress-bar').width(data.percent + "%").attr("aria-valuenow", data.percent);
        //Intercom('update');
    },

    deploymentSuccess: function(data) {
        $("div.progress").hide();
        $("img.spinner").hide();
        $(".survey").hide();
        var $info = $("#info-message-section");
        $(".form-deploy h3").text("Deployed " + data['app_name']);
        $info.removeClass('alert-info').addClass('alert-success');
        $info.html('<span class="glyphicon glyphicon-ok"></span> ' + data['message']);
        var urls = [];
        $.each(data.app_url.split(" "), function() {
            var app_link = $('<p><a class="app-url" href="' + this + '">' + this + '</a></p>');
            urls.push(app_link);
        });
        $info.after(urls);

        if(data['username'] || data['password']) {
            var auth_data = '<div class="alert alert-info auth-details">Authentication details<br/>' +
                            '<strong>Username:</strong> ' + data['username'] + '<br/>' +
                            '<strong>Password:</strong> ' + data['password'] +
                            '</div>';
            $(auth_data).insertAfter($info);
        }
        //Intercom('update');
},

    deploymentFail: function(data) {
        $("div.progress").hide();
        $("img.spinner").hide();
        var $info = $("#info-message-section");
        $info.removeClass('alert-info').addClass('alert-danger');
        $info.html('<span class="glyphicon glyphicon-remove"></span> ' + data['message']);
        Intercom('update');
    }
});

App.EmbedView = Backbone.View.extend({
    events: {
        "click .btn": "generateEmbedCode"
    },

    initialize: function() {
        this.imageTxt = $('#embed-image-code');
        this.markdownTxt = $('#embed-markdown-code');
        this.htmlTxt = $('#embed-html-code');
        this.restTxt = $('#embed-rest-code');
    },

    generateEmbedCode: function(event) {
        $('.btn').removeClass('active');
        var $btn = $(event.currentTarget);
        $btn.addClass('active');
        var size = $btn.data('size');
        var color = $btn.data('color');
        var slug = $btn.data('slug');
        var imgURL = this.generateImgURL(size, color);
        var appURL = this.generateAppURL(slug);
        this.markdownTxt.text(this.generateMarkdownCode(imgURL, appURL));
        this.htmlTxt.text(this.generateHTMLCode(imgURL, appURL));
        this.restTxt.text(this.generateRestCode(imgURL, appURL));
        this.imageTxt.text(imgURL);
        return false;
    },

    generateMarkdownCode: function(imgURL, appURL) {
        return "[![Launch demo site]("+ imgURL + ")](" + appURL + ")";
    },

    generateHTMLCode: function(imgURL, appURL) {
        return '<a href="' + appURL + '"><img src="' + imgURL + '"></a>';
    },

    generateRestCode: function(imgURL, appURL) {
        return '.. image:: ' + imgURL+ '\n   :target: ' + appURL;
    },

    generateImgURL: function(size, color) {
        return 'http://edustack.bistu.edu.cn/static/img/buttons/btn-' + size + '-' + color + '.png';
    },

    generateAppURL: function(slug) {
        return 'http://edustack.bistu.edu.cn/' + slug + '/';
    }
});

$(function(){
    App.deployFormView  = new App.DeployFormView();
    if(App.deployFormView.showEmbedButtons === true) {
        App.embedView = new App.EmbedView({el: '#embed-buttons'});
    }
});
