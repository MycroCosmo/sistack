$(function () {
  var form = $('#searchForm');
  function listUrl() { return form.attr('data-base') + '/' + 'list' + '.do'; }
  form.on('submit', function () { form.attr('action', listUrl()); form.find('[name=page]').val(1); });
  $('[data-page]').on('click', function () {
    form.attr('action', listUrl());
    form.find('[name=page]').val($(this).attr('data-page'));
    form[0].submit();
  });
  // $.get('/board/oldList.do', function (rows) { renderRows(rows); });
});
