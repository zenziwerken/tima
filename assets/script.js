/*
* @author Daniel Groß
* Last modified: 2025/03/20 17:42:07
*/

(function () {
    const progresscircle = document.getElementById('progress-circle');
    const progressText = document.getElementById('progress-text');
    const progressPath = document.getElementById('progress-innercircle');
    const progressOuterPath = document.getElementById('progress-outercircle');
    const elapsedTimeDisplay = document.getElementById('elapsed-time');
    const settingsButton = document.getElementById('settings-button');
    const settingsDialog = document.getElementById('settings-dialog');
    const closeButton = document.getElementById('close-button');
    const beepTimesInput = document.getElementById('beep-times');
    const timerDurationInput = document.getElementById('timer-duration');
    const resetTimer = document.getElementById('reset-timer');
    const toggleCheckbox = document.getElementById('theme-toggle-checkbox');
    let beep;

    function createFallbackBeep() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "assets/beep.js"; //github.com/luciferous/beepjs/blob/master/beep.js
            script.onload = () => {
                try {
                    const beepsound = new Beep(22050).encode(650, 0.06, [Beep.utils.amplify(8000)]);
                    beep = new Audio('data:audio/x-wav;base64,' + btoa(beepsound));
                    resolve(beep);
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = (error) => {
                reject(new Error('Fehler beim Laden von beep.js: ' + error));
            };
            document.head.appendChild(script);
        });
    }

    try {
        beep = new Audio("assets/blip-131856.mp3");
        beep.addEventListener('error', () => {
            beep = createFallbackBeep();
        });
    } catch (e) {
        beep = createFallbackBeep();
    }
            
    let beepTimes = [45, 30, 15, 3, 2, 1, 0];
    const timerDurationPreset = 60;
    let timerDuration = timerDurationPreset;
    const timerDevider = 10;
    let timeLeft = timerDuration * timerDevider;
    let elapsedTime = 0;
    let countdown;
    let running = false;
    const totalLength = 1165;
    const gap = 19;

    function setCookie(name, value, days) {
        if (window.localStorage) {
            window.localStorage.setItem(name, value);
        } else {
            const d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";path=/";
        }
    }

    function getCookie(name) {
        if (window.localStorage) {
            return window.localStorage.getItem(name);
        } else {
            const cname = name + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(cname) === 0) {
                    return c.substring(cname.length, c.length);
                }
            }
            return "";
        }
    }

    function sanitizebeepTimesInput(input) {
        return input
            .split(',')
            .map(n => Number(n.trim()))
            .filter(n => !isNaN(n) && n <= timerDuration)
            .sort((a, b) => b - a);
    }

    function loadSettings() {
        const timerDurationCookie = getCookie("timerDuration");
        if (timerDurationCookie) {
            const newValue = Number(timerDurationCookie);
            timerDuration = (newValue <= 0 || isNaN(newValue)) ? timerDurationPreset : newValue;
            timerDurationInput.value = timerDuration;
            timeLeft = timerDuration * timerDevider;
            progressText.innerText = timerDuration;
        }
        const savedTheme = getCookie('theme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
            toggleCheckbox.checked = savedTheme === 'light-mode';
        }
        const beepTimesCookie = getCookie("beepTimes");
        if (beepTimesCookie) {
            beepTimes = sanitizebeepTimesInput(beepTimesCookie);
            beepTimesInput.value = beepTimes.join(',');
        }
        calculateBeepGaps();
    }

    function calculateBeepGaps() {
        const beepTimesTemp = [timerDuration, ...beepTimes, 0];

        const dashArray = beepTimesTemp
            .map((time, i, arr) => i < arr.length - 1 ? time - arr[i + 1] : null)
            .filter(interval => interval > 0)
            .map((interval, i, arr) => {
                const calculatedGap = i === arr.length - 1 ? 0 : gap;
                return `${(interval / timerDuration) * totalLength - calculatedGap} ${calculatedGap}`;
            })
            .join(' ');

        progressOuterPath.style.strokeDasharray = dashArray;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    settingsButton.addEventListener('click', () => {
        settingsDialog.style.display = settingsDialog.style.display === 'block' ? 'none' : 'block';
    });

    closeButton.addEventListener('click', () => {
        settingsDialog.style.display = 'none';
    });

    beepTimesInput.addEventListener('change', () => {
        beepTimes = sanitizebeepTimesInput(beepTimesInput.value);
        calculateBeepGaps();
        setCookie("beepTimes", beepTimes.join(','), 365);
        beepTimesInput.value = beepTimes.join(',');
    });

    timerDurationInput.addEventListener('change', () => {
        const newValue = Number(timerDurationInput.value);
        timerDuration = (newValue <= 0 || isNaN(newValue)) ? timerDurationPreset : newValue;
        setCookie("timerDuration", timerDuration, 365);
        timeLeft = timerDuration * timerDevider;
        progressText.innerText = timerDuration;
        timerDurationInput.value = timerDuration;
        calculateBeepGaps();
    });

    progresscircle.addEventListener('click', () => {
        if (!running) {
            running = true;
            countdown = setInterval(() => {
                timeLeft--;
                elapsedTime++;
                const timeLeft_in_seconds = Math.floor(timeLeft / timerDevider);
                progressPath.style.strokeDashoffset = (timeLeft / (timerDuration * timerDevider)) * totalLength;
                progressPath.style.transition = timeLeft > (timerDuration * timerDevider - 2) ? 'none' : 'stroke-dashoffset 0.1s linear';
                if (timeLeft % timerDevider === 0) {
                    progressText.innerText = timeLeft === 0 ? timerDuration : timeLeft_in_seconds;
                    elapsedTimeDisplay.innerText = formatTime(Math.floor(elapsedTime / timerDevider));
                    if (beepTimes.includes(timeLeft_in_seconds)) {
                        beep.play();
                    }
                }
                if (timeLeft <= 0) {
                    timeLeft = timerDuration * timerDevider;
                }
                resetTimer.style.display = elapsedTime > 0 ? 'flex' : 'none';
            }, 1000 / timerDevider);
        } else {
            clearInterval(countdown);
            running = false;
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        const body = document.body;
        const savedTheme = getCookie('theme');
        if (savedTheme) {
            body.classList.add(savedTheme);
            toggleCheckbox.checked = savedTheme === 'light-mode';
        }

        toggleCheckbox.addEventListener('change', function () {
            body.classList.toggle('light-mode', this.checked);
            body.classList.toggle('dark-mode', !this.checked);
            setCookie('theme', this.checked ? 'light-mode' : 'dark-mode', 365);
        });

        const resetTimerButton = document.getElementById('reset-timer-button');
        resetTimerButton.addEventListener('click', () => {
            clearInterval(countdown);
            running = false;
            timeLeft = timerDuration * timerDevider;
            elapsedTime = 0;
            progressText.innerText = timerDuration;
            progressPath.style.strokeDashoffset = totalLength;
            elapsedTimeDisplay.innerText = formatTime(0);
            resetTimer.style.display = 'none';
        });
    });

    loadSettings();
})();