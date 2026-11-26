import { useState } from 'react'
import HeroParallax from './HeroParallax'
import Navbar from './Navbar'
import ThemeSection from './ThemeSection'
import HighlightsSection from './components/HighlightsSection'
import ElasticGallery from './components/gallery/ElasticGallery'
import RevelCrtStage from './RevelCRTStage'
import { DEFAULT_REVEL_LINEUP } from "./revelLineupConfig";
import ArcShowcaseSection from "./components/ArcShowcaseSection"
import { showcaseConfig } from './components/showcaseConfig'
import Footer from './components/Footer/Footer'

function App() {

  return (
    <>
    <Navbar />
    <HeroParallax/>
    <ThemeSection />
    <HighlightsSection />
      <ElasticGallery />
      <RevelCrtStage
        droneSrc="/drone_8s.mp4"
        loopSrc="/loop_video.mp4"
        holeLeft={4}
        holeTop={13}
        holeWidth={72}
        holeHeight={77}
        lineup={DEFAULT_REVEL_LINEUP}
        />
        <ArcShowcaseSection
      workshops={showcaseConfig.workshops}
      competitions={showcaseConfig.competitions}
    />
    <Footer />
      
    </>
  )
}

export default App
