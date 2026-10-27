$(function () {
  var form = $('#searchForm');
  form.on('submit', function () {
    form.find('[name=page]').val(1);
  });
  $('[data-page]').on('click', function () {
    form.find('[name=page]').val($(this).attr('data-page'));
    form[0].submit();
  });

  $('#loadCategories, #refreshCategories').on('click', function () {
    var button = $(this).prop('disabled', true);
    $.ajax({
      url: button.data('url'),
      type: 'GET',
      dataType: 'json'
    }).done(function (result) {
      var items = $('#categoryItems').empty();
      $.each(result.codes, function (index, code) {
        $('<li>').text(code.label).appendTo(items);
      });
      $('#categoryStatus').text(result.total + '건 조회 완료');
    }).fail(function () {
      $('#categoryStatus').text('조회에 실패했습니다. 로그인 상태와 권한을 확인하세요.');
    }).always(function () {
      button.prop('disabled', false);
    });
  });
});
