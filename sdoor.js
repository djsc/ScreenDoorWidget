
const FIREBASE_USER_ID = '';
const firebaseConfig = {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: ''
};

//TODO: Changing the screen dimensions won't add/remove html elements
const NUM_ROWS = 4;
const NUM_COLS = 20;

const startWidget = () => {
    try {
        if (!firebase) {
            throw Error('Firebase not initialized');
        }
        firebase.initializeApp(firebaseConfig);
    } catch (err) {
        displayError('Error retrieving post', err);
        return;
    }
    obtainPosts();
};

const obtainPosts = () => {
    try {
        if (!firebase) {
            throw Error('Firebase not initialized');
        }
        firebase.database().ref('/users/' + FIREBASE_USER_ID + '/posts').orderByChild('timePosted').limitToLast(1)
            .once('value', (snapshot) => {
                processPosts(snapshot);
            });
    } catch (err) {
        displayError('Error listening for posts', err);
        return;
    }
};

const processPosts = (snapshot) => {
    if (!snapshot || !snapshot.hasChildren()) {
        displayPost('');
        return;
    }
    let lastPost;
    //add each post in reverse order. If snapshot.val() is used, posts are unordered, so use forEach instead
    snapshot.forEach(snap => {
        console.log('processing post');
        const post = snap.val();
        if (!isPostValid(post)) {
            return false;
        }
        lastPost = post;
        return false;
    });
    if (lastPost === undefined) {
        displayPost(undefined);
        return;
    }
    //sanitize any text you display from the databse
    displayPost(lastPost);
};

const isPostValid = (post) => {
    return (post !== undefined &&
        post.text !== undefined &&
        post.timePosted !== undefined &&
        post.uuid !== undefined);
};

const getLines = (text, numRows, numColumns) => {
    text = removeNonAscii(text);
    if (typeof text !== 'string' ||
        typeof numRows !== 'number' ||
        typeof numColumns !== 'number'
    ) {
        return [];
    }
    const lines = [];
    const groups = text.split('\n');
    for (const group of groups) {
        if (lines.length >= numRows) {
            break;
        }
        const words = group.split(' ');
        if (words.length === 0) {
            continue;
        }
        let currentWord = 0;
        for (let i = lines.length; i < numRows; i++) {
            if (currentWord >= words.length) {
                break;
            }
            let currentLine = '';
            let charsOnCurrentLine = 0;
            for (let k = currentWord; k < words.length; k++) {
                const currentWordLength = words[currentWord].length;
                const potentialCharsAdded = (charsOnCurrentLine === 0 ? 0 : 1) + currentWordLength;
                if (charsOnCurrentLine === 0 && currentWordLength > numColumns) {
                    currentLine += words[currentWord].slice(0, numColumns);
                    charsOnCurrentLine += numColumns;
                    words[currentWord] = words[currentWord].slice(numColumns);
                } else if (charsOnCurrentLine + potentialCharsAdded <= numColumns) {
                    currentLine += ((charsOnCurrentLine === 0 ? '' : ' ') + words[currentWord]);
                    charsOnCurrentLine += potentialCharsAdded;
                    currentWord++;
                } else {
                    break;
                }
            }
            lines.push(currentLine);
        }
    }
    for (let i = 0; i < lines.length; i++) {
        lines[i] = sanitizeText(lines[i]);
    }
    const numLinesMissing = numRows - lines.length;
    for (let i = 0; i < numLinesMissing; i++) {
        lines.push('');
    }
    return lines;
};

const removeNonAscii = (text) => {
    if (typeof text !== 'string') {
        return '';
    }
    // eslint-disable-next-line no-control-regex
    return text.replace(/[^\x00-\xFF]/g, '');
};

/**
 * escapes html to prevent xss
 */
const sanitizeText = (text) => {
    if (typeof text !== 'string') {
        return '';
    }
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\//g, '&#47;');
};

const getTimestampAgeString = (timestamp) => {
    if (typeof timestamp !== 'number') {
        return '?';
    }
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 0) {
        return '?';
    }
    const seconds = diff / 1000;
    if (seconds < 60) {
        const secondsFormatted = parseInt(seconds);
        return secondsFormatted + ' second' + (secondsFormatted === 1 ? '' : 's');
    }
    const minutes = diff / 60000;
    if (minutes < 60) {
        const minutesFormatted = parseInt(minutes);
        return minutesFormatted + ' minute' + (minutesFormatted === 1 ? '' : 's');
    }
    const hours = diff / 3600000;
    if (hours < 24) {
        return hours.toFixed(1) + ' hours';
    }
    const days = diff / 86400000;
    if (days < 365) {
        return days.toFixed(1) + ' days';
    }
    const years = diff / 31540000000;
    return years.toFixed(1) + ' years';
};

const displayError = (errorToDisplay, errorObj) => {
    console.error(errorToDisplay, errorObj);
    displayPost({ text: errorToDisplay, timePosted: Date.now(), uuid: -1 });
};

const displayPost = (post) => {
    const lineElements = [document.getElementById('sdoorline1'),
        document.getElementById('sdoorline2'),
        document.getElementById('sdoorline3'),
        document.getElementById('sdoorline4')
    ];
    const timestampElement = document.getElementById('sdoortimestamp');
    if (!lineElements[0] || !lineElements[1] || !lineElements[2] || !lineElements[3] || !timestampElement) {
        console.error('Couldn\'t find html elements');
        return;
    }
    const lines = isPostValid(post) ? getLines(post.text, NUM_ROWS, NUM_COLS) : [];
    const timestamp = isPostValid(post) ? post.timePosted : '';
    const numLines = lines.length;
    console.log('Displaying post');
    for (let i = 0; i < NUM_ROWS; i++) {
        let line = i < numLines ? lines[i] : '';
        if (typeof line !== 'string') {
            line = '';
        }
        lineElements[i].innerHTML = line;
    }
    timestampElement.innerHTML = '- Posted ' + getTimestampAgeString(timestamp) + ' ago';
};

document.addEventListener('DOMContentLoaded', () => {
    startWidget();
});