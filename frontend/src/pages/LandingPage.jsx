import Header from '../components/Header'
import Hero from '../components/landing/Hero'
import Advantages from '../components/landing/Advantages'
import CamerasSection from '../components/landing/CamerasSection'
import Gallery from '../components/landing/Gallery'
import StaffSection from '../components/landing/StaffSection'
import Tariffs from '../components/landing/Tariffs'
import HowToCheckIn from '../components/landing/HowToCheckIn'
import Contacts from '../components/landing/Contacts'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Advantages />
      <CamerasSection />
      <Gallery />
      <StaffSection />
      <Tariffs />
      <HowToCheckIn />
      <Contacts />
      <Footer />
    </>
  )
}
