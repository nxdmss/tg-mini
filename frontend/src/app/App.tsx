import Header from "../components/layout/Header";
import BottomBar from "../components/layout/BottomBar";
import HomePage from "../pages/HomePage";

export default function App() {
  return (
    <div>
      <Header />
      <HomePage />
      <BottomBar />
    </div>
  );
}