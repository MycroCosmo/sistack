$(function () {
  var form = $('#searchForm');
  function listUrl() {
    return form.attr('data-base') + '/' + 'list' + '.do';
  }

  form.on('submit', function () {
    form.attr('action', listUrl());
    form.find('[name=page]').val(1);
  });

  $('[data-page]').on('click', function () {
    form.attr('action', listUrl());
    form.find('[name=page]').val($(this).attr('data-page'));
    form[0].submit();
  });

  $('#loadCodes').on('click', function () {
    var button = $(this);
    $.ajax({
      url: form.attr('data-base') + '/list' + 'Json.do',
      type: 'GET',
      dataType: 'json',
      data: {
        page: form.find('[name=page]').val()
      }
    }).done(function (result) {
      var body = $('#codeRows').empty();
      $.each(result.codes, function (index, code) {
        var row = $('<tr>');
        $('<td>').text(code.code).appendTo(row);
        $('<td>').text(code.label).appendTo(row);
        body.append(row);
      });
      $('#codeStatus').text(result.total + '건 조회 완료');
    }).fail(function () {
      $('#codeStatus').text('조회에 실패했습니다. 로그인 상태와 권한을 확인하세요.');
    }).always(function () {
      button.prop('disabled', false);
    });
    button.prop('disabled', true);
  });

  $('#deleteForm').on('submit', function (event) {
    event.preventDefault();
    var deleteForm = $(this);
    var button = deleteForm.find('button');
    button.prop('disabled', true);
    $.ajax({
      url: deleteForm.attr('data-base') + '/delete' + '.do',
      type: 'POST',
      dataType: 'json',
      data: {
        id: deleteForm.find('[name=id]').val(),
        csrf: deleteForm.find('[name=csrf]').val()
      }
    }).done(function (result) {
      if (result.success) {
        window.location.href = deleteForm.attr('data-base') + '/list.do';
      } else {
        $('#deleteStatus').text('삭제하지 못했습니다.');
      }
    }).fail(function () {
      $('#deleteStatus').text('삭제에 실패했습니다. 로그인 상태와 권한을 확인하세요.');
    }).always(function () {
      button.prop('disabled', false);
    });
  });

  // $.get('/board/oldList.do', function (rows) { renderRows(rows); });
});
