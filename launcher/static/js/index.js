!(function(){

  "use strict";

  var loginContainer = $("#loginContainer");

  $('.stack_block').click(function() {
    var currentSelect = $(this).find('span').text();
    // loginContainer.removeClass('hidden');
    $('#mymodal').modal();
    $('#serviceName').text(currentSelect);
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

}());

