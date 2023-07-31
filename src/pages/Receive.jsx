import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import { useAccount, useNetwork } from "wagmi";
import { ethers } from "ethers";
import receiveABI from "../../abis/receive.json";
import { erc20ABI } from "wagmi";
import { useSearchParams } from "react-router-dom";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} from "@axelar-network/axelarjs-sdk";
import {
  bnb_ausdc,
  polygon_ausdc,
  avalanche_ausdc,
  celo_ausdc,
} from "../../utils/constant";
import { toast } from "react-toastify";

export default function Receive() {
  let [search] = useSearchParams();
  const { address: my_adr } = useAccount();
  const address = search.get("address");
  const chain_s = search.get("chain");
  const { chain } = useNetwork();

  const network = chain?.network;
  const amountRef = useRef();

  console.log(chain_s);

  const caddress =
    chain_s === "bsc-testnet"
      ? "0x1c79E559ab894F098881793c0479b5de6d8731c4"
      : chain_s === "maticmum"
      ? "0xFF8efDf68a5c0E2f5b776416FA8b087dA32808c9"
      : chain_s === "avalanche-fuji"
      ? "0x12ce743624ddfe6c138f48896cfd28c397554e28"
      : chain_s === "celo-alfajores"
      ? "0xaE6eA4945F206C22122E63Dd5387982F23121f36"
      : "";

  console.log(caddress);

  const rchain =
    chain_s === "bsc-testnet"
      ? "Binance"
      : chain_s === "maticmum"
      ? "Polygon"
      : chain_s === "avalanche-fuji"
      ? "Avalanche"
      : chain_s === "celo-alfajores"
      ? "Celo"
      : "";

  const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
  const gasNetwork =
    network === "bsc-testnet"
      ? "bnb"
      : network === "maticmum"
      ? "matic"
      : network === "avalanche-fuji"
      ? "avax"
      : network === "celo-alfajores"
      ? "celo"
      : "";

  const [allowance, setAllowance] = useState(0);
  const [balance, setBalance] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [gas, setGasFee] = useState(0);

  const createReceiveContract = async () => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    const receiveContract = new ethers.Contract(caddress, receiveABI, signer);
    return receiveContract;
  };

  const createUSDContract = async () => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    const caddress_ausdc =
      network === "bsc-testnet"
        ? bnb_ausdc
        : network === "maticmum"
        ? polygon_ausdc
        : network === "avalanche-fuji"
        ? avalanche_ausdc
        : network === "celo-alfajores"
        ? celo_ausdc
        : "";

    console.log(caddress_ausdc);

    const usdcContract = new ethers.Contract(caddress_ausdc, erc20ABI, signer);
    return usdcContract;
  };

  const allowanceCheck = async () => {
    const contract = await createUSDContract();
    if (caddress === "") {
      return toast.error("Please connect to a supported chain - here");
    }
    const amount = await contract.allowance(address, caddress);
    const balance = await contract.balanceOf(address);
    setBalance(balance / 10 ** 6);
    setAllowance(amount / 10 ** 6);
  };

  const calculateGas = async (chainT) => {
    // Calculate how much gas to pay to Axelar to execute the transaction at the destination chain
    const gasFee = await api.estimateGasFee(
      network === "bsc-testnet"
        ? EvmChain.BNBCHAIN
        : network === "maticmum"
        ? EvmChain.POLYGON
        : network === "avalanche-fuji"
        ? EvmChain.AVALANCHE
        : network === "celo-alfajores"
        ? EvmChain.CELO
        : "",
      chainT === "Binance"
        ? EvmChain.BNBCHAIN
        : chainT === "Polygon"
        ? EvmChain.POLYGON
        : chainT === "Avalanche"
        ? EvmChain.AVALANCHE
        : chainT === "Celo"
        ? EvmChain.CELO
        : "",
      network === "bsc-testnet"
        ? GasToken.BNBCHAIN
        : network === "maticmum"
        ? GasToken.MATIC
        : network === "avalanche-fuji"
        ? GasToken.AVAX
        : network === "celo-alfajores"
        ? GasToken.CELO
        : "",
      700000,
      2
    );

    setGasFee(gasFee);
  };

  const sendAusdc = async (evt) => {
    evt.preventDefault();
    const contract = await createReceiveContract();
    if (amountRef.current.value === "") {
      return toast.error("Please enter aUSDC amount");
    }

    const amount = ethers.utils.parseUnits(amountRef.current.value, 6);
    const wallet = [address];
    console.log(wallet);

    const id = toast.loading("Transaction in progress..");

    console.log(rchain, caddress, wallet, "aUSDC", my_adr, amount);

    try {
      const tx = await contract.sendToMany(
        rchain,
        caddress,
        wallet,
        "aUSDC",
        my_adr,
        amount,
        {
          value: gas,
        }
      );

      await tx.wait();
      amountRef.current.value = "";
      setGasFee(0);
      allowanceCheck();

      toast.update(id, {
        render:
          "Transaction successfull, Transfer will be finanlized in few minutes",
        type: "success",
        isLoading: false,
        autoClose: 1000,
        closeButton: true,
      });
    } catch (error) {
      console.log(error);
      toast.update(id, {
        render: `${error.reason}`,
        type: "error",
        isLoading: false,
        autoClose: 1000,
        closeButton: true,
      });
    }
  };

  const approveAusdc = async (evt) => {
    evt.preventDefault();
    const contract = await createUSDContract();
    const amount = ethers.utils.parseUnits(amountRef.current.value, 6);

    const id = toast.loading("Transaction in progress..");

    try {
      const tx = await contract.approve(caddress, amount);
      await tx.wait();
      toast.update(id, {
        render: "Approval successfull",
        type: "success",
        isLoading: false,
        autoClose: 1000,
        closeButton: true,
      });
      allowanceCheck();
      const allowance = await contract.allowance(address, caddress);
      setAllowance(allowance / 10 ** 6);
    } catch (error) {
      console.log(error);
      toast.update(id, {
        render: `${error.reason}`,
        type: "error",
        isLoading: false,
        autoClose: 1000,
        closeButton: true,
      });
    }
  };

  useEffect(() => {
    allowanceCheck();
    calculateGas(rchain);
  }, [allowance, network]);

  return (
    <div>
      <Header />

      <div className="p-10  sm:w-9/12 lg:w-5/12 w-full mx-auto mt-20 mb-10 flex flex-col justify-start items-center blue-glassmorphism">
        <div className="text4"> You can pay aUSDC from any chain below</div>
        <div className="text41"> Binance || Polygon || Celo || Avalanche</div>

        <input
          value={`My Balance - ${balance}`}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        />
        <input
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
          value={`Recipient Address -  ${address}`}
        />
        <input
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
          value={
            chain_s === "bsc-testnet"
              ? "Recipient Chain - Binance"
              : chain_s === "maticmum"
              ? "Recipient Chain - Polygon"
              : chain_s === "avalanche-fuji"
              ? "Recipient Chain - Avalanche"
              : ""
          }
        />

        <input
          placeholder="Enter Amount"
          ref={amountRef}
          onChange={() => setCurrentAmount(amountRef.current.value)}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        />
        <input
          value={`GasFee - ${gas / 10 ** 18} ${gasNetwork}`}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        />

        <div className="h-[1px] w-full bg-gray-400 my-2" />

        {allowance >= currentAmount ? (
          <button
            type="button"
            onClick={sendAusdc}
            className="text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] hover:bg-[#3d4f7c] rounded-full cursor-pointer"
          >
            Send now
          </button>
        ) : (
          <button
            type="button"
            onClick={approveAusdc}
            className="text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] hover:bg-[#3d4f7c] rounded-full cursor-pointer"
          >
            Approve
          </button>
        )}
      </div>
    </div>
  );
}
