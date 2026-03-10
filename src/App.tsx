import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Builder from './components/Builder';
import Practice from './components/Practice';
import Rewards from './components/Rewards';
import Spellbooks from './components/Spellbooks';
import MagicPortal from './components/MagicPortal';
import MastersGrid from './components/MastersGrid';
import WitchsNoose from './components/WitchsNoose';
import SeersWordsearch from './components/SeersWordsearch';
import LexiconLeak from './components/LexiconLeak';
import Settings from './components/Settings';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import GlobalLayout from './components/GlobalLayout';
import { ThemeProvider } from './context/ThemeContext';
import { KeyboardProvider } from './context/KeyboardContext';

export default function App() {
  return (
    <ThemeProvider>
      <KeyboardProvider>
        <Router>
          <GlobalLayout>
            <SplashScreen>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/spellbooks" element={<Spellbooks />} />
                  <Route path="/portal" element={<MagicPortal />} />
                  <Route path="/masters-grid/:listId" element={<MastersGrid />} />
                  <Route path="/witchs-noose/:listId" element={<WitchsNoose />} />
                  <Route path="/seers-wordsearch/:listId" element={<SeersWordsearch />} />
                  <Route path="/lexicon-leak/:listId" element={<LexiconLeak />} />
                  <Route path="/builder" element={<Builder />} />
                  <Route path="/builder/:id" element={<Builder />} />
                  <Route path="/practice/:id" element={<Practice />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </SplashScreen>
          </GlobalLayout>
        </Router>
      </KeyboardProvider>
    </ThemeProvider>
  );
}
