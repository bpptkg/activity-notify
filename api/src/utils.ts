export const findMedian = (numbers: number[]) => {
    if (numbers.length === 0) throw new Error("No numbers provided");
    const sortedNumbers = (JSON.parse(JSON.stringify(numbers))).sort((a: number, b: number) => a - b);
    const midIndex = Math.floor(sortedNumbers.length / 2);

    if (sortedNumbers.length % 2 === 0) {
        return (sortedNumbers[midIndex - 1] + sortedNumbers[midIndex]) / 2;
    } else {
        return sortedNumbers[midIndex];
    }
};