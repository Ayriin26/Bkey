// Braille mapping: number sequence -> letter
const brailleMap = {
    '9': 'A', '85': 'B', '89': 'C', '896': 'D', '86': 'E',
    '895': 'F', '8956': 'G', '856': 'H', '95': 'I', '956': 'J',
    '82': 'K', '852': 'L', '892': 'M', '8962': 'N', '862': 'O',
    '9852': 'P', '89562': 'Q', '8562': 'R', '952': 'S', '9562': 'T',
    '823': 'U', '8523': 'V', '9563': 'W', '8923': 'X', '89623': 'Y', '8623': 'Z'
};

let currentSequence = '';
let inputBuffer = [];
let outputText = '';
let audioEnabled = true;
const synth = window.speechSynthesis || null;

const inputDisplay = document.getElementById('input-display');
const outputDisplay = document.getElementById('output-display');

// Initial placeholders
inputDisplay.textContent = 'Type Something...';
outputDisplay.textContent = '';

// Render mapping guide on load
renderMappingGuide();

// Keyboard event listener (numpad + top row digits)
document.addEventListener('keydown', (e) => {
    if (e.location === 3 || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'].includes(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
    }
});

// Click handlers for on-screen keys
document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', () => {
        const keyValue = key.dataset.key;
        handleKeyPress(keyValue);
    });
});

function handleKeyPress(key) {
    // Narrate the key itself (default English voice)
    speak(getKeyName(key));

    highlightKey(key);

    const keyElement = document.querySelector(`[data-key="${key}"]`);
    const action = keyElement ? keyElement.dataset.action : undefined;

    if (action === 'space') {
        // End of letter, just finishes braille sequence visually
        processSequence();
        inputBuffer.push(' ');
    } else if (action === 'break') {
        // End of word: finish letter, add space, then speak full output
        processSequence();
        outputText += ' ';
        inputBuffer.push(' ');
        updateDisplay();
        speakSentence();
        return;
    } else if (action === 'enter') {
        // End of line: finish letter, add newline, then speak full output
        processSequence();
        outputText += '\n';
        inputBuffer.push('\n');
        updateDisplay();
        speakSentence();
        return;
    } else if (action === 'backspace') {
        // Remove last braille dot first, else last character of output
        if (currentSequence) {
            currentSequence = currentSequence.slice(0, -1);
            if (inputBuffer.length > 0) {
                inputBuffer.pop();
            }
        } else if (outputText.length > 0) {
            outputText = outputText.slice(0, -1);
        }
    } else if (action === 'delete') {
        // Clear current dot sequence entirely
        currentSequence = '';
        if (inputBuffer.length > 0) {
            inputBuffer.pop();
        }
    } else if (key === '.' && !action) {
        currentSequence = '';
    } else if (['2', '3', '5', '6', '8', '9'].includes(key)) {
        // Dot keys for braille input
        currentSequence += key;
        inputBuffer.push(key);
    }

    updateDisplay();
}

function processSequence() {
    if (currentSequence && brailleMap[currentSequence]) {
        const letter = brailleMap[currentSequence];
        outputText += letter;
        // No letter-level speak here, only keys + full sentence
    } else if (currentSequence) {
        // Invalid sequence - feedback
        speak('invalid sequence');
    }
    currentSequence = '';
}

function highlightKey(key) {
    const keyElement = document.querySelector(`[data-key="${key}"]`);
    if (keyElement) {
        keyElement.classList.add('active');
        setTimeout(() => keyElement.classList.remove('active'), 200);
    }
}

function speak(text) {
    if (audioEnabled && synth && text) {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        synth.speak(utterance);
    }
}

function speakSentence() {
    const trimmed = outputText.trim();
    if (trimmed) {
        speak(trimmed);
    } else {
        speak('nothing to speak');
    }
}

function getKeyName(key) {
    const names = {
        '0': 'space', '1': 'break', '4': 'enter',
        '7': 'backspace', '.': 'delete',
        '2': 'two', '3': 'three', '5': 'five',
        '6': 'six', '8': 'eight', '9': 'nine'
    };
    return names[key] || key;
}

function updateDisplay() {
    const displayText = inputBuffer.length === 0 && !currentSequence
        ? 'Type Something...'
        : inputBuffer.join('');
    inputDisplay.textContent = displayText;
    outputDisplay.textContent = outputText || '';
}

function clearAll() {
    currentSequence = '';
    inputBuffer = [];
    outputText = '';
    updateDisplay();
    speak('all cleared');
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const indicator = document.getElementById('audio-indicator');
    const status = document.getElementById('audio-status');
    indicator.classList.toggle('on', audioEnabled);
    status.textContent = `Audio: ${audioEnabled ? 'ON' : 'OFF'}`;

    if (audioEnabled) {
        setTimeout(() => speak('audio enabled'), 100);
    } else if (synth) {
        synth.cancel();
    }
}

function copyOutput() {
    if (outputText) {
        navigator.clipboard.writeText(outputText).then(() => {
            speak('text copied to clipboard');
        }).catch(() => {
            speak('copy failed');
        });
    } else {
        speak('nothing to copy');
    }
}

function speakOutput() {
    speakSentence();
}

function renderMappingGuide() {
    const grid = document.getElementById('mapping-grid');
    const sortedEntries = Object.entries(brailleMap).sort((a, b) => a[1].localeCompare(b[1]));

    sortedEntries.forEach(([code, letter]) => {
        const item = document.createElement('div');
        item.className = 'mapping-item';
        item.innerHTML = `
            <div class="mapping-letter">${letter}</div>
            <div class="mapping-code">${code}</div>
        `;
        item.onclick = () => {
            outputText += letter;
            updateDisplay();
            speak(letter);
        };
        grid.appendChild(item);
    });
}
