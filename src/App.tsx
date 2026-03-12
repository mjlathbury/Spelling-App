import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Builder from './components/Builder';
import Practice from './components/Practice';
import Rewards from './components/Rewards';
import Spellbooks from './components/Spellbooks';
import TrainingGround from './components/TrainingGround';
import TrialSanctuary from './components/TrialSanctuary';
import WizardsGrid from './components/WizardsGrid';
import WitchsNoose from './components/WitchsNoose';
import SeersWordsearch from './components/SeersWordsearch';
import LexiconLeak from './components/LexiconLeak';
import Settings from './components/Settings';
import ClassicTest from './components/ClassicTest';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import GlobalLayout from './components/GlobalLayout';
import { ThemeProvider } from './context/ThemeContext';
import { KeyboardProvider } from './context/KeyboardContext';
import { AudioProvider } from './context/AudioContext';

export default function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <KeyboardProvider>
          <Router>
            <GlobalLayout>
              <SplashScreen>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/spellbooks" element={<Spellbooks />} />
                    <Route path="/training" element={<TrainingGround />} />
                    <Route path="/trial" element={<TrialSanctuary />} />
                    <Route path="/classic-test/:listId" element={<ClassicTest />} />
                    <Route path="/masters-grid/:listId" element={<WizardsGrid />} />
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
      </AudioProvider>
    </ThemeProvider>
  );
}
