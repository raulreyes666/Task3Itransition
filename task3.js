const readlineSync = require('readline-sync'), crypto = require('crypto'), Table = require('cli-table3');

function generateHMAC(secretKey, message) {
    return crypto.createHmac('sha256', secretKey).update(message.toString()).digest('hex');
}

function generateRandomNumber(range) {
    return Math.floor(Math.random() * range);
}

function showHelp(diceSets) {
    const table = new Table({head: ['Dice Set', 'Probability of Winning'], colWidths: [20, 20]});
    diceSets.forEach((dice, index) => {
        const probability = (Math.max(...dice) / 9).toFixed(2);
        table.push([`[${dice.join(', ')}]`, `${(probability * 100).toFixed(2)}%`]);
    });
    console.log(table.toString());
}

function chooseFirstPlayer(diceSets) {
    const secretKey = crypto.randomBytes(32).toString('hex'), computerChoice = generateRandomNumber(2), hmac = generateHMAC(secretKey, computerChoice);
    console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);
    let userGuess = readlineSync.question("Try to guess my selection:\n0 - 0\n1 - 1\nX - exit\n? - help\nYour selection: ");
    while (!['0', '1', 'X', '?'].includes(userGuess)) {
        console.log("Invalid selection. Please enter 0, 1, X, or ? for help.");
        userGuess = readlineSync.question("Try to guess my selection:\n0 - 0\n1 - 1\nX - exit\n? - help\nYour selection: ");
    }
    if (userGuess === 'X') return null;
    if (userGuess === '?') {
        showHelp(diceSets);
        return chooseFirstPlayer(diceSets);
    }
    const userChoice = parseInt(userGuess, 10);
    console.log(`My selection: ${computerChoice} (KEY=${secretKey}).`);
    return userChoice === computerChoice ? ('user') : ('computer');
}

function selectDice(diceSets, alreadySelectedIndex) {
    console.log("Choose your dice:");
    diceSets.forEach((dice, index) => {
        if (index !== alreadySelectedIndex) console.log(`${index} - ${dice.join(', ')}`);
    });
    const selection = readlineSync.question("Your selection: ");
    const selectedIndex = parseInt(selection, 10);
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= diceSets.length || selectedIndex === alreadySelectedIndex) {
        console.log("Invalid selection. Please try again.");
        return selectDice(diceSets, alreadySelectedIndex);
    }
    return selectedIndex;
}

function rollDice(dice, player) {
    console.log(`\n${player} is rolling...`);
    const randomIndex = generateRandomNumber(dice.length), secretKey = crypto.randomBytes(32).toString('hex'), hmac = generateHMAC(secretKey, randomIndex);
    console.log(`I selected a random value in the range 0..${dice.length - 1} (HMAC=${hmac}).`);
    const userSelection = readlineSync.question("Add your number modulo 6:\n0 - 0\n1 - 1\n2 - 2\n3 - 3\n4 - 4\n5 - 5\nX - exit\n? - help\nYour selection: ");
    if (userSelection === 'x') return null;
    const userNumber = parseInt(userSelection, 10), resultIndex = (randomIndex + userNumber) % dice.length;
    console.log(`(${randomIndex} + ${userNumber}) % ${dice.length} = ${resultIndex}`);
    console.log(`${player}'s roll is: ${dice[resultIndex]} (KEY=${secretKey}).`);
    return dice[resultIndex];
}

function playDiceGame(diceSets) {
    const firstPlayer = chooseFirstPlayer(diceSets);
    if (!firstPlayer) return console.log("Game exited.");
    let computerDiceIndex, userDiceIndex;
    if (firstPlayer === 'computer') {
        computerDiceIndex = generateRandomNumber(diceSets.length);
        console.log(`I make the first move and choose the [${diceSets[computerDiceIndex].join(', ')}] dice.`);
        userDiceIndex = selectDice(diceSets, computerDiceIndex);
    } else {
        userDiceIndex = selectDice(diceSets, null);
        console.log(`You make the first move and choose the [${diceSets[userDiceIndex].join(', ')}] dice.`);
        computerDiceIndex = generateRandomNumber(diceSets.length - 1);
    }
    console.log(`You chose: [${diceSets[userDiceIndex].join(', ')}]`);
    console.log(`I chose: [${diceSets[computerDiceIndex].join(', ')}]`);
    const computerRoll = rollDice(diceSets[computerDiceIndex], 'Computer');
    const userRoll = rollDice(diceSets[userDiceIndex], 'User');
    if (userRoll === null || computerRoll === null) return console.log("Game exited.");
    if (userRoll > computerRoll) {
        console.log(`You win! ${userRoll} > ${computerRoll}`);
    } else if (computerRoll > userRoll) {
        console.log(`Computer wins! ${computerRoll} > ${userRoll}`);
    } else {
        console.log("It's a tie!");
    }
}

function main() {
    const args = process.argv.slice(2);
    if (args.length < 3) return console.log("Invalid input. Please provide at least 3 sets of dice with 6 integers comma-separated.");
    const diceSets = args.map(arg => arg.split(',').map(Number));
    for (const dice of diceSets) {
        if (dice.length !== 6 || dice.some(isNaN)) {
            return console.log("Invalid dice format. Each dice set must contain exactly 6 integers.");
        }
    }
    playDiceGame(diceSets);
}

main();
