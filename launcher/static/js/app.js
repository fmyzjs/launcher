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
            return "您必须输入Email!";
        }

        if(attrs.email.length > 60) {
            return "您输入的Email地址太长了 (>60 字符)";
        }
    }

});

// Views
App.DeployFormView = Backbone.View.extend({
    el: $('#wholePage'),

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
        var project = this.project || this.projects.findWhere({'resource_uri': this.$('#serviceUri').val()});
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
        var self = this;
        if(deploy.isValid()) {
            checkEmail(email, function(err, isOk) {
                if (err) {
                  validFail('出错了:' + err);
                } else {
                  if (isOk) {
                    App.deployStatusView = new App.DeployStatusView(app_data);
                    App.deployStatusView.render();
                    deploy.save({}, {
                        error: App.deployStatusView.deploymentFail
                    });
                  } else {
                    validFail('您的邮箱未注册!');
                  }
                }
            });
        }
        else {
          validFail();
        }

        function validFail(msg) {
            console.log('valid fail!');
            self.$('div.form-group').addClass('has-error');
            var $errorMessage = $(".help-block");
            if (!!msg) {
              $errorMessage.text(msg);
            } else {
              $errorMessage.text(deploy.validationError);
            }
        }

        function checkEmail(email, callback) {
          var xhr = new XMLHttpRequest();
          var url = 'http://launch.bistu.edu.cn/email/esEmail.txt';
          xhr.open('GET', url, false);
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                var res = xhr.responseText;
                var items = null;
                var item = null;
                try {
                  items = JSON.parse(res);
                  for (var i = 0, len = items.length; i < len; i++) {
                    item = items[i];
                    if (email.toLowerCase() === item['email'].toLowerCase()) {
                      // equal
                      callback(null, true);
                      break;
                    }
                  }
                  // not equal
                  callback(null, false);
                } catch (e) {
                  console.log(e);
                }
              } else {
                callback(new Error('connect fail'));
              }
            }
          };

          xhr.send();
        }
    }

});

App.DeployStatusView = Backbone.View.extend({
    el: $("#wholePage"),
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
        this.$el.removeClass("modal-backdrop");

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
        $(".modal-title h4").text("已经生成 " + data['app_name']);
        $info.removeClass('alert-info').addClass('alert-success');
        $info.html('<span class="glyphicon glyphicon-ok"></span> ' + data['message']);
        var urls = [];
        $.each(data.app_url.split(" "), function() {
            var app_link = $('<p><a class="app-url" href="' + this + '">' + this + '</a></p>');
//window.location.assign(this);
//            urls.push(app_link);
        });
//        $info.after(urls);

	var urls = data.app_url.split(' ');
	var urlHtml = '';
	urls.forEach(function(val) {
          urlHtml += '<p><a class="app-url" href="' + val + '" target="_blank">' + val + '</a></p>';
        });
        if(data['username'] || data['password']) {
            var auth_data = '<div class="alert alert-info auth-details">认证信息<br/>' +
                            '<strong>用户名:</strong> ' + data['username'] + '<br/>' +
                            '<strong>密码:</strong> ' + data['password'] + '<br/>' +
			    '<strong>应用地址:</strong><br/>' + urlHtml +
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
        //Intercom('update');
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
        return 'http://launch.bistu.edu.cn/static/img/buttons/btn-' + size + '-' + color + '.png';
    },

    generateAppURL: function(slug) {
        return 'http://launch.bistu.edu.cn/' + slug + '/';
    }
});

$(function(){
    App.deployFormView  = new App.DeployFormView();
    if(App.deployFormView.showEmbedButtons === true) {
        App.embedView = new App.EmbedView({el: '#embed-buttons'});
    }
  "use strict";

  var loginContainer = $("#loginContainer");

  $('.stack_block').click(function() {
    var currentSelect = $(this).find('span').text();
    var currentSelectUri = $(this).find('input').val();
    // loginContainer.removeClass('hidden');
    console.log(currentSelectUri);
    console.log(currentSelect);
    $('#mymodal').modal();
    $('#serviceName').text(currentSelect);
    $('#serviceUri').val(currentSelectUri);
  });

  $('#loginCancelBtn').click(function() {
    // loginContainer.addClass('hidden');
  });

  function centerModal() {
    $(this).css('display', 'block');
    var $dialog = $(this).find(".modal-dialog");
    var offset = ($(window).height() - $dialog.height()) / 2.4;
    // Center modal vertically in window
    $dialog.css("margin-top", offset);
  }

  $('.modal').on('show.bs.modal', centerModal);

  $(window).on("resize", function () {
    $('.modal:visible').each(centerModal);
  });
});


