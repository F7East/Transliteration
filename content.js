let originalTextContent = {}; // Variable to store the original content
var buttonState = 'off'

// Receive messages from the background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message && message.message === 'Button state changed') {
    buttonState = message.state;
    if (buttonState === 'on') {
      chrome.runtime.sendMessage({ message: 'Button activated' });
      changeTextContent();
    } else if (buttonState === 'off') {
      chrome.runtime.sendMessage({ message: 'Button desactivated' });
      resetTextContent();
    }
  } else if (message && message.message === 'Page reloaded') {
      changeTextContent();
  }

    // Send a response back to the sender
    sendResponse({ success: true });
});



// Notify the background script that the content script has been loaded
chrome.runtime.sendMessage({ message: 'Content script loaded' });


function resetTextContent() {
  for (const key in originalTextContent) {
    const textNode = originalTextContent[key].node;
    const originalText = originalTextContent[key].text;
    chrome.runtime.sendMessage({ message: 'textNode reverted' });
    textNode.textContent = originalText;
  }


  originalTextContent = {};
}

function changeTextContent() {
  const textNodes = document.evaluate("//text()", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

  for (let i = 0; i < textNodes.snapshotLength; i++) {
    const textNode = textNodes.snapshotItem(i);
    const originalText = textNode.textContent;
    const newText = transliterateKazakh(originalText);

    if (originalText !== newText) {
      const key = `textNode_${i}`;
      originalTextContent[key] = {
        node: textNode,
        text: originalText
      };
      textNode.textContent = newText;
      chrome.runtime.sendMessage({ message: 'textNode saved' });
    }
  }
}

//scrolling
function handleScroll(){
  if (buttonState === 'on'){
    chrome.runtime.sendMessage({ message: 'Scrolling detected'})
    changeTextContent();
  }
}
window.addEventListener('scroll', handleScroll);


// MutationObserver for text changing on page 
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      chrome.runtime.sendMessage({ message: 'Mutation registered'})
      handleAddedNodes(mutation.addedNodes);
    }
  });
});

const observerOptions = {
  subtree: true,
  childList: true,
};

observer.observe(document.body, observerOptions);


function handleAddedNodes(addedNodes) {
  for (let i = 0; i < addedNodes.length; i++) {
    const addedNode = addedNodes[i];
    // Check if the node is a text node
    if (addedNode.nodeType === Node.TEXT_NODE) {
      const originalText = addedNode.textContent;
      const newText = transliterateKazakh(originalText);
      // chrome.runtime.sendMessage({ message: 'originalText', value: originalText });
      // chrome.runtime.sendMessage({ message: 'newText', value: newText });
      
      if (originalText !== newText) {
        chrome.runtime.sendMessage({ message: 'textNode mutated' });
        const key = `addedTextNode_${i}`;
        originalTextContent[key] = {
          node: addedNode,
          text: originalText,
        };
        addedNode.textContent = newText;
      }
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