import "./style.css";

const $ = (selector: string) => document.querySelector(selector);

const $time = $("time") as HTMLTimeElement;
const $paragraph = $("paragraph") as HTMLParagraphElement;
const $input = $("input") as HTMLInputElement;

const INITIAL_TIME = 30;

const TEXT =
    "The quick brown fox jumps over the lazy dog but the dog is not lazy, it is just tired. However, that will not stop him.";

let words = [];
let currentTime = 0;

enum Classes {
    Word = "x-word",
    Letter = "x-letter",
    Active = "active",
    Correct = "correct",
    Incorrect = "incorrect",
    Last = "last",
    Incomplete = "incomplete",
}

function cl(...classes: Classes[]) {
    return classes.join(".");
}

function start() {
    if (!$time || !$paragraph || !$input) return;

    words = TEXT.split(" ");
    currentTime = INITIAL_TIME;

    $time.textContent = currentTime.toString();

    // Break and wrap all words with html tags
    $paragraph.innerHTML = words
        .map((word) => {
            const letters = word.split("");

            return `<${Classes.Word}>
              ${letters.map((letter) => `<${Classes.Letter}>${letter}</${Classes.Letter}>`).join("")}
            </${Classes.Word}>`;
        })
        .join("");

    // Style the current first letter
    const $firstWord = $paragraph.querySelector(Classes.Word);
    $firstWord?.classList.add(Classes.Active);
    const $firstLetter = $firstWord?.querySelector(Classes.Letter);
    $firstLetter?.classList.add(Classes.Active);

    setEvents();

    // Create timer interval and clean up when finished
    const timerInterval = setInterval(() => {
        currentTime--;

        $time.textContent = currentTime.toString();

        if (currentTime === 0) {
            clearInterval(timerInterval);
            end();
        }
    }, 1000);
}

function end() {
    console.log("Game over");
}

function setEvents() {
    if (!$time || !$paragraph || !$input) return;

    // Recapture focus when input is unfocused
    $input.addEventListener("blur", () => {
        document.addEventListener("keydown", onKeyDownDocument);
    });

    //
    $input.addEventListener("keydown", onKeyDownInput);
    $input.addEventListener("keyup", onKeyUpInput);
}

// Auto focus on input when pressing any key
// Remove the event listener after focusing
function onKeyDownDocument() {
    $input.focus();
    document.removeEventListener("keydown", onKeyDownDocument);
}

function onKeyDownInput(event: KeyboardEvent) {
    if (event.key === " ") {
        event.preventDefault();
        const $activeWord = $paragraph.querySelector(cl(Classes.Word, Classes.Active));
        const $activeLetter = $activeWord?.querySelector(cl(Classes.Letter, Classes.Active));

        // Get the next word element
        const $nextWord = $activeWord?.nextElementSibling;
        // Get the next letter element
        const $nextLetter = $nextWord?.querySelector(Classes.Letter);

        // Remove classes from current elements
        $activeWord?.classList.remove(Classes.Active, Classes.Incomplete);
        $activeLetter?.classList.remove(Classes.Active);

        // Add classes to next elements
        $nextWord?.classList.add(Classes.Active);
        $nextLetter?.classList.add(Classes.Active);

        $input.value = "";

        // Mark the word if incomplete
        if ($activeWord?.querySelectorAll(`${Classes.Letter}:not(.${Classes.Correct})`).length! > 0) {
            $activeWord?.classList.add(Classes.Incomplete);
        }
        return;
    }

    if (event.key === "Backspace") {
        const $activeWord = $paragraph.querySelector(cl(Classes.Word, Classes.Active));
        const $activeLetter = $activeWord?.querySelector(cl(Classes.Letter, Classes.Active));

        // Get the previous word element
        const $prevWord = $activeWord?.previousElementSibling;
        // Get the next letter element
        const $prevLetter = $activeLetter?.previousElementSibling;

        if (!$prevLetter && !$prevWord) {
            event.preventDefault();
            return;
        }

        // Move cursor back to previous word
        if (!$prevLetter) {
            event.preventDefault();

            // Previous word must be incomplete
            if (!$prevWord?.classList.contains(Classes.Incomplete)) {
                return;
            }

            // Remove active from current word
            $activeWord?.classList.remove(Classes.Active, Classes.Incomplete);
            // Remove active from current letter
            $activeLetter?.classList.remove(Classes.Active);

            // Set active to previous word
            $prevWord?.classList.add(Classes.Active);
            // Remove incomplete from previous word
            $prevWord?.classList.remove(Classes.Incomplete);

            // Find last letter in previous word
            const prevLetters = $prevWord?.querySelectorAll(Classes.Letter);

            let $prevLetter: Element | null = null;
            for (let i = prevLetters.length - 1; i >= 0; i--) {
                if (
                    prevLetters[i].classList.contains(Classes.Correct) ||
                    prevLetters[i].classList.contains(Classes.Incorrect)
                ) {
                    $prevLetter = i === prevLetters.length - 1 ? prevLetters[i] : prevLetters[i + 1];
                    break;
                }
            }

            if (!$prevLetter) {
                return;
            }

            // Set active to last letter in previous word
            $prevLetter.classList.add(Classes.Active);

            // Set the input value to the previous word
            $input.value = [
                ...$prevWord?.querySelectorAll(
                    `${cl(Classes.Letter, Classes.Correct)},${cl(Classes.Letter, Classes.Incorrect)}`
                ),
            ]
                .map(($letter) => {
                    return $letter.classList.contains(Classes.Correct)
                        ? $letter.textContent
                        : $letter.getAttribute("data-incorrect");
                })
                .join("");

            return;
        }
    }
}

function onKeyUpInput() {
    const $activeWord = $paragraph.querySelector(cl(Classes.Word, Classes.Active));
    const $expectedLetters = $activeWord?.querySelectorAll(Classes.Letter);
    const $activeLetter = $activeWord?.querySelector(cl(Classes.Letter, Classes.Active));

    const currentWord = $activeWord?.textContent?.trim();

    // Limit the input size
    $input.maxLength = currentWord!.length;

    // Clean classes
    $expectedLetters?.forEach(($letter) => {
        $letter.classList.remove(Classes.Correct, Classes.Incorrect);
    });

    // Compare and add corresponding classes
    $input.value.split("").forEach((letter, i) => {
        const $expectedLetter = $expectedLetters![i];
        const expectedValue = currentWord![i];

        const isCorrect = letter === expectedValue;

        $expectedLetter.classList.add(isCorrect ? Classes.Correct : Classes.Incorrect);

        // If incorrect, save the incorrect value as a data attribute
        // Otherwise, remove the data attribute
        if (!isCorrect) {
            $expectedLetter.setAttribute("data-incorrect", letter);
        } else {
            $expectedLetter.removeAttribute("data-incorrect");
        }
    });

    // Remove active from current letter
    $activeLetter?.classList.remove(Classes.Active, Classes.Last);
    // Set active to next letter, if it exists
    const inputLength = $input.value.length;
    const $nextActiveLetter = $expectedLetters![inputLength];
    if ($nextActiveLetter) {
        $expectedLetters![inputLength].classList.add(Classes.Active);
    } else {
        console.log("ADDED LAST");
        $activeLetter?.classList.add(Classes.Active, Classes.Last);
    }
}

start();
