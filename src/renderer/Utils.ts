export async function WaitFor(seconds: number) {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
