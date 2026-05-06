
//#region DOM Section
const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");

// So it can be changed
const originTextElement = document.querySelector("#origin-text p");

// added for additional features
const wpmDisplay = document.querySelector("#wpm");
const errorDisplay = document.querySelector("#errors");
const scoreList = document.querySelector("#score-list");
//#endregion


//Specifics variables for what I need to present on
//Dark mode/theme
const themeToggleButton = document.querySelector("#dark-toggle");

function toggleTheme() {
    document.body.classList.toggle("dark-theme");

    if (document.body.classList.contains("dark-theme")) {
        localStorage.setItem(themeStorageKey, "dark");
        themeToggleButton.textContent = "Light Mode";
    } else {
        localStorage.setItem(themeStorageKey, "light");
        themeToggleButton.textContent = "Dark Mode";
    }
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);

    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        themeToggleButton.textContent = "Light Mode";
    } else {
        document.body.classList.remove("dark-theme");
        themeToggleButton.textContent = "Dark Mode";
    }
}

//#region Code for base function

const themeStorageKey = "typingTestTheme";

// handle all results and data for speed
const typeState = {
    timerInterval: null,
    startTime: 0,
    elapsedTime: 0,
    errorCount: 0,
    typingStarted: false,
    testFinished: false,
    currentlyHasError: false,
};

// for the reset randomizing:
const textPrompts = [
    "Tres tristes tigres tragaban trigo en un trigal. Un tigre, dos tigres, tres tigres tragaban en un trigal.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "Betty Botter bought some butter, but she said the butter's bitter.",
    "Red lorry, yellow lorry, red lorry, yellow lorry.",
    "She sells seashells by the seashore.",
    "Como poco coco como, poco coco compro."
];

const localStrgKey = "typingTestScores";



// Add leading zero to numbers 9 or below (purely for aesthetics):
// Using .padStart to do this
function formatTime(milliseconds) {
    const totallHundrths = Math.floor(milliseconds / 10);

    const hundredths = totallHundrths % 100;
    const seconds = Math.floor(totallHundrths / 100) % 60;
    const minutes = Math.floor(totallHundrths / 6000);

    // cast into string and pad
    const formatMinutes = String(minutes).padStart(2, "0");
    const formatSeconds = String(seconds).padStart(2, "0");
    const formatHundredths = String(hundredths).padStart(2, "0");

    return `${formatMinutes}:${formatSeconds}:${formatHundredths}`;
}


//Combining these two, it makes more sense to me
// Start the timer:
// Run a standard minute/second/hundredths timer:
function runTimer() {
    typeState.elapsedTime = Date.now() - typeState.startTime;
    theTimer.textContent = formatTime(typeState.elapsedTime);
    updateWpm();
}

function startTimer() {
    if (typeState.typingStarted || typeState.testFinished)
        return;
    typeState.typingStarted = true;
    typeState.startTime = Date.now() - typeState.elapsedTime;
    typeState.timerInterval = setInterval(runTimer, 10);

}

function stopTimer() {
    clearInterval(typeState.timerInterval);
    typeState.timerInterval = null;
    typeState.elapsedTime = Date.now() - typeState.startTime;
}

function calculateWpm() {
    const totalSeconds = typeState.elapsedTime / 1000;
    if (totalSeconds <= 0)
        return 0;
    return Math.round(((testArea.value.length / 5) / (totalSeconds / 60)) || 0);
}

//put everywhere that loops to get the most uptodate time
function updateWpm() {
    if (wpmDisplay)
        wpmDisplay.textContent = calculateWpm();
}

function updateErrorDisplay() {
    if (errorDisplay)
        errorDisplay.textContent = typeState.errorCount;
}


// Match the text entered with the provided text on the page:
//This took a little while for it to click in my head
function loadScores() {
    const savedScores = localStorage.getItem(localStrgKey);
    if (!savedScores)
        return [];

    try {
        return JSON.parse(savedScores);
    } catch (error) {
        console.warn("Saved scores could not be read. Resetting score list.", error);
        localStorage.removeItem(localStrgKey);
        return [];
    }
}

function saveScores(scores) {
    localStorage.setItem(localStrgKey, JSON.stringify(scores));
}

//hardest part for me
function renderScores() {
    const scores = loadScores();
    if (!scoreList)
        return;

    scoreList.innerHTML = "";
    if (scores.length === 0) {
        const emptyScore = document.createElement("li");
        emptyScore.textContent = "No saved scores yet.";
        scoreList.appendChild(emptyScore);
        return;
    }

    scores.forEach((score, index) => {
        const scoreItem = document.createElement("li");
        scoreItem.textContent = `${index + 1}. ${score.time} - ${score.wpm} WPM - ${score.errors} errors`;
        scoreList.appendChild(scoreItem);
    });
}

function saveCompletedScore() {
    const scores = loadScores();
    //obj just for better score-handling
    const newScore = {
        time: formatTime(typeState.elapsedTime),
        timeMs: typeState.elapsedTime,
        wpm: calculateWpm(),
        errors: typeState.errorCount,
        completedAt: new Date().toISOString()
    };

    scores.push(newScore);
    scores.sort((firstScore, secondScore) => firstScore.timeMs - secondScore.timeMs);
    saveScores(scores.slice(0, 3));
    renderScores();
}

function setWrapperState(color) {
    testWrapper.style.borderColor = color;
}

function spellCheck() {
    const typedText = testArea.value;
    const originText = originTextElement.textContent;
    const originTextMatch = originText.substring(0, typedText.length);

    if (typeState.testFinished) {
        return;
    }

    if (typedText === originText) {
        typeState.testFinished = true;
        typeState.currentlyHasError = false;
        stopTimer();
        setWrapperState("#34d399");
        updateWpm();
        saveCompletedScore();
        return;
    }

    if (typedText === "") {
        typeState.currentlyHasError = false;
        setWrapperState("grey");
        updateWpm();
        return;
    }

    if (typedText === originTextMatch) {
        typeState.currentlyHasError = false;
        setWrapperState("#38bdf8");
    } else {
        if (!typeState.currentlyHasError) {
            typeState.errorCount += 1;
            updateErrorDisplay();
        }

        typeState.currentlyHasError = true;
        setWrapperState("#fb7185");
    }

    updateWpm();
}

function pickRandomPrompt() {
    const randomIndex = Math.floor(Math.random() * textPrompts.length);
    originTextElement.textContent = textPrompts[randomIndex];
}

// Reset everything:
function reset() {
    clearInterval(typeState.timerInterval);
    typeState.timerInterval = null;
    typeState.startTime = 0;
    typeState.elapsedTime = 0;
    typeState.errorCount = 0;
    typeState.typingStarted = false;
    typeState.testFinished = false;
    typeState.currentlyHasError = false;

    testArea.value = "";
    theTimer.textContent = "00:00:00";
    updateWpm();
    updateErrorDisplay();
    setWrapperState("grey");
    pickRandomPrompt();
    testArea.focus();
}

// Event listeners for keyboard input and the reset button.
testArea.addEventListener("input", () => {
    if (testArea.value.length > 0) {
        startTimer();
    }

    spellCheck();
});
//#endregion

//dark theme toggle
themeToggleButton.addEventListener("click", toggleTheme);


//anti-cheat
testArea.onpaste = (event) => {
    event.preventDefault();
    alert("Stop Trying To Cheat And Just Type.");
};

testArea.ondrop = (event) => {
    event.preventDefault();
    alert("Nice Try I Thought Of This Too");
};


resetButton.addEventListener("click", reset);

applySavedTheme();
renderScores();
reset();