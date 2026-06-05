/* 把 hexo-blog-encrypt 的提示语放进密码输入框作为 placeholder（框内占位文字）。
 * 设置成功后隐藏原本在框上方的说明 label；
 * 若 JS 未执行（极少数），上方 label 仍会显示，作为降级。 */
(function () {
  function apply() {
    var box = document.getElementById('hexo-blog-encrypt');
    if (!box) return;
    var pass = box.querySelector('#hbePass');
    var labelText = box.querySelector('.hbe-input-label-content');
    if (pass && labelText) {
      var msg = (labelText.textContent || '').trim();
      if (msg) pass.setAttribute('placeholder', msg);
      var labelBox = box.querySelector('.hbe-input-label');
      if (labelBox) labelBox.style.display = 'none';
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
