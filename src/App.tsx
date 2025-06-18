import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Scraping from './pages/Scraping';
import Correction from './pages/Correction';
import Audio from './pages/Audio';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/scraping" element={<Scraping />} />
          <Route path="/correction" element={<Correction />} />
          <Route path="/audio" element={<Audio />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;