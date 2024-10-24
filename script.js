
const items = [
    { name: "Guldmyntpung", weight: 6, value: 15 },
    { name: "Silverring", weight: 3, value: 7 },
    { name: "Diamant", weight: 2, value: 14 },
    { name: "Guldsvärd", weight: 10, value: 20 },
    { name: "Antik vas", weight: 5, value: 12 },
    { name: "Smyckeskrin", weight: 7, value: 17 },
    { name: "Silversköld", weight: 8, value: 19 },
    { name: "Kungakrona", weight: 9, value: 25 },
    { name: "Guldstaty", weight: 12, value: 30 },
    { name: "Antik bok", weight: 1, value: 3 },
    { name: "Rubiner", weight: 4, value: 9 },
    { name: "Safirer", weight: 3, value: 8 },
    { name: "Guldring", weight: 2, value: 6 },
    { name: "Smaragd", weight: 5, value: 11 },
    { name: "Ädelstenar", weight: 1, value: 10 },
    { name: "Mysteriebägare", weight: 7, value: 18 }
];

const maxWeight = 24;
const MAX_RETRIES = 100; // Max number of attempts to generate a valid individual

function createIndividual() {
    return Array.from({ length: items.length }, () => Math.random() < 0.5 ? 1 : 0);
}

function calculateFitness(individual) {
    let totalWeight = 0;
    let totalValue = 0;
    individual.forEach((gene, i) => {
        if (gene === 1) {
            totalWeight += items[i].weight;
            totalValue += items[i].value;
        }
    });
    return totalWeight > maxWeight ? 0 : totalValue;
}

function createPopulation(populationSize) {
    return Array.from({ length: populationSize }, createIndividual);
}

// Round Robin (Roulette Wheel) Selection
function roundRobinSelection(population) {
    const fitnesses = population.map(calculateFitness);
    const totalFitness = fitnesses.reduce((acc, fitness) => acc + fitness, 0);
    if (totalFitness === 0) return [randomChoice(population), randomChoice(population)];
    const probabilities = fitnesses.map(fitness => fitness / totalFitness);
    return [randomSelection(population, probabilities), randomSelection(population, probabilities)];
}

// Tournament Based Selection
function tournamentSelection(population, tournamentSize) {
    const selectedIndividuals = [];
    for (let i = 0; i < 2; i++) {
        const tournamentGroup = Array.from({ length: tournamentSize }, () => randomChoice(population));
        const winner = tournamentGroup.reduce((best, individual) =>
            calculateFitness(individual) > calculateFitness(best) ? individual : best);
        selectedIndividuals.push(winner);
    }
    return selectedIndividuals;
}

function randomSelection(arr, probabilities) {
    let random = Math.random();
    for (let i = 0; i < arr.length; i++) {
        if (random < probabilities[i]) return arr[i];
        random -= probabilities[i];
    }
    return arr[arr.length - 1];
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Updated crossover function with retry mechanism
function crossover(parent1, parent2) {
    let child1, child2;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
        const crossoverPoint = Math.floor(Math.random() * parent1.length);
        child1 = parent1.slice(0, crossoverPoint).concat(parent2.slice(crossoverPoint));
        child2 = parent2.slice(0, crossoverPoint).concat(parent1.slice(crossoverPoint));

        if (calculateFitness(child1) > 0 && calculateFitness(child2) > 0) {
            return [child1, child2]; // Return valid children
        }
        attempts++;
    }

    // If no valid child is found after retries, return the original parents as fallback
    return [parent1, parent2];
}

// Updated mutate function with retry mechanism
function mutate(individual, mutationRate) {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
        individual.forEach((gene, i) => {
            if (Math.random() < mutationRate) {
                individual[i] = 1 - individual[i];  // Flip the gene
            }
        });
        if (calculateFitness(individual) > 0) {
            return; // Valid individual, exit function
        }
        attempts++;
    }

    // If no valid mutation is found after retries, the individual is left unchanged
}

async function runGeneticAlgorithm(populationSize, numGenerations, mutationRate, newIndividuals, tournamentSize, selectionMethod) {
    let population = createPopulation(populationSize);

    for (let generation = 0; generation < numGenerations; generation++) {
        let newPopulation = [];

        // Create new individuals from crossover and mutation for the rest of the population
        for (let i = 0; i < newIndividuals / 2; i++) {
            const [parent1, parent2] = selectionMethod === "roundRobin" ?
                roundRobinSelection(population) : tournamentSelection(population, tournamentSize);
            const [child1, child2] = crossover(parent1, parent2);
            mutate(child1, mutationRate);
            mutate(child2, mutationRate);
            newPopulation.push(child1, child2);
        }

        population = newPopulation;

        const bestIndividual = population.reduce((best, individual) =>
            calculateFitness(individual) > calculateFitness(best) ? individual : best);
        displayGenerationResult(bestIndividual, generation + 1);

        // Wait 3 seconds before showing the next generation
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const bestIndividual = population.reduce((best, individual) =>
        calculateFitness(individual) > calculateFitness(best) ? individual : best);
    displayFinalResult(bestIndividual);
}

function displayGenerationResult(bestIndividual, generation) {
    const generationDiv = document.getElementById('generation-result');
    let output = `<h3>Generation ${generation}</h3>`;
    let totalValue = 0;
    bestIndividual.forEach((gene, i) => {
        if (gene === 1) {
            output += `<p>- ${items[i].name}: Vikt ${items[i].weight}, Värde ${items[i].value}</p>`;
            totalValue += items[i].value;
        }
    });
    output += `<h4>Total Value: ${totalValue}</h4>`;
    generationDiv.innerHTML = output;
}

function displayFinalResult(bestIndividual) {
    const resultDiv = document.getElementById('result');
    let output = "<h2>Optimal Distribution</h2>";
    let totalValue = 0;
    bestIndividual.forEach((gene, i) => {
        if (gene === 1) {
            output += `<p>- ${items[i].name}: Vikt ${items[i].weight}, Värde ${items[i].value}</p>`;
            totalValue += items[i].value;
        }
    });
    output += `<h3>Total Value: ${totalValue}</h3>`;
    resultDiv.innerHTML = output;
}

function startAlgorithm() {
    const populationSize = parseInt(document.getElementById('populationSize').value);
    const numGenerations = parseInt(document.getElementById('numGenerations').value);
    const mutationRate = parseFloat(document.getElementById('mutationRate').value);
    const newIndividuals = parseInt(document.getElementById('newIndividuals').value);
    const tournamentSize = parseInt(document.getElementById('tournamentSize').value);
    const selectionMethod = document.getElementById('selectionMethod').value;

    runGeneticAlgorithm(populationSize, numGenerations, mutationRate, newIndividuals, tournamentSize, selectionMethod);
}
