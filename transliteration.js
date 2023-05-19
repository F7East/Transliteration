function changeTextContent() {
    // Get all text nodes in the document
    const textNodes = document.evaluate("//text()", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    
    for (let i = 0; i < textNodes.snapshotLength; i++) {
      const textNode = textNodes.snapshotItem(i);
      const originalText = textNode.textContent;
      const newText = transliterateKazakh(originalText);
      
      if (originalText !== newText) {
        textNode.textContent = newText;
      }
    }
  }
    
  const cyrillicToLatin = {
    'Һ': 'h', 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'j', 'з': 'z',
    'й': 'y', 'и': 'ï', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
    'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 's', 'ч': 'sh', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'y',
    'ь': '', 'э': 'e', 'ю': 'u', 'я': 'a', 'ё': 'o', 'і': 'i', 'ғ': 'gh', 'қ': 'q', 'ң': 'nh', 'ү': 'ü',
    'ұ': 'w', 'ә': 'ä', 'ө': 'ö'
  };
  
  Object.keys(cyrillicToLatin).forEach(function (key) {
    cyrillicToLatin[key.charAt(0).toUpperCase() + key.slice(1)] = cyrillicToLatin[key].charAt(0).toUpperCase() + cyrillicToLatin[key].slice(1);
  });
  
  const vowels = 'аәеёиоөуүұыэюя';
  
  function transliterateKazakh(text) {
      let previousLetter = null;
      let newtext = '';
    
      for (let i = 0; i < text.length; i++) {
        const character = text[i];
        let result = character;
    
        if (cyrillicToLatin.hasOwnProperty(character)) {
          if (isFitToSplitDiphthong(character, previousLetter)) {
            result = splitDiphthong(character);
          } else {
            result = cyrillicToLatin[character];
          }
        }
    
        newtext += result;
        previousLetter = character;
      }
    
      return newtext;
  }
    
  function isFitToSplitDiphthong(currentLetter, previousLetter) {
      if (!isDiphthong(currentLetter)) {
        return false;
      }
      if (previousLetter === null) {
        return true;
      }
      if (previousLetter.toLowerCase() === 'и') {
        return false;
      }
      return (vowels + 'ьъ ').includes(previousLetter.toLowerCase());
  }
    
  function isDiphthong(letter) {
      return 'еёюяЕЁЮЯ'.includes(letter);
  }
    
  function splitDiphthong(character) {
    var firstLetter = character.toUpperCase() === character ? 'Й' : 'й';
    return cyrillicToLatin[firstLetter] + cyrillicToLatin[character.toLowerCase()];
  }