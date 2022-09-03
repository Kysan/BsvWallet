// * pour faire des sortes de chunck d'addresses
const splitInGroupOf = (arr: any[], chunkSize: number): any[] =>
  arr.reduce(
    (chunks, newElement) => {
      const lastChunk = chunks[chunks.length - 1];

      if (lastChunk.length < chunkSize) {
        lastChunk.push(newElement);
      } else {
        chunks.push([newElement]);
      }
      return chunks;
    },
    [[]]
  );

export { splitInGroupOf };
