import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import "@rainbow-me/rainbowkit/styles.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import {
  polygonMumbai,
  celoAlfajores,
  avalancheFuji,
  bscTestnet,
} from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import Payment from "./pages/Payment";
import Receive from "./pages/Receive";

function App() {
  const { chains, publicClient } = configureChains(
    [polygonMumbai, celoAlfajores, avalancheFuji, bscTestnet],
    [publicProvider()]
  );
  const { connectors } = getDefaultWallets({
    appName: "My RainbowKit App",
    projectId: "2b59a50447305d116602bfcbc02b5bd6",
    chains,
  });
  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  });
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <BrowserRouter>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/payment" element={<Payment />} />
            <Route exact path="/receive" element={<Receive />} />
          </Routes>
          <ToastContainer autoClose={15000} />
        </BrowserRouter>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
