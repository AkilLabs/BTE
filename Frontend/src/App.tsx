import Hero from './components/Hero';

function App() {
  const handleGetStarted = () => {
    const generator = document.getElementById('generator');
    generator?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Hero onGetStarted={handleGetStarted} />
    </div>
  );
}

export default App;
