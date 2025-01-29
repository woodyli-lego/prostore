const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const Homepage = async () => {
  await delay(500)
  return <div>Homepage</div>;
};

export default Homepage;
