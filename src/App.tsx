import { useEffect, useState } from 'react';
import Home from './pages/Home';
import CaseStudy from './pages/CaseStudy';
import Playground from './pages/Playground';
import FruitSorting from './pages/FruitSorting';

// tiny hash-based router — no dependency needed for two pages, and hash
// routes work on any static host without server-side rewrite config
// (unlike path-based routing, which GitHub Pages and similar don't
// support out of the box).
function getRoute() {
  return window.location.hash.replace(/^#\/?/, '');
}

function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    function onHashChange() {
      setRoute(getRoute());
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'easysbc') return <CaseStudy />;
  if (route === 'playground') return <Playground />;
  if (route === 'fruit-sorting') return <FruitSorting />;
  return <Home />;
}

export default App;
