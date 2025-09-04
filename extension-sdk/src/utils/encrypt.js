function encrypt(text) {
  var result = "";
  for (var i = 0; i < text.length; i++) {
    var charCode = text.charCodeAt(i);
    var encryptedCharCode = charCode + 1;
    result += String.fromCharCode(encryptedCharCode);
  }
  return result;
}

export { encrypt }