import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import { SiEthereum } from "react-icons/si";
import { BsInfoCircle } from "react-icons/bs";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { ethers } from "ethers";
import sendABI from "../../abis/send.json";
import { erc20ABI } from "wagmi";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} from "@axelar-network/axelarjs-sdk";
import {
  bnb_pay,
  polygon_pay,
  avalanche_pay,
  celo_pay,
  bnb_ausdc,
  polygon_ausdc,
  avalanche_ausdc,
  celo_ausdc,
} from "../../utils/constant";
import { toast } from "react-toastify";

export default function Home() {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const network = chain?.network;
  const amountRef = useRef();
  const chainRef = useRef();
  const walletRef = useRef();

  const api = new AxelarQueryAPI({ environment: Environment.TESTNET });

  const caddress =
    network === "bsc-testnet"
      ? bnb_pay
      : network === "maticmum"
      ? polygon_pay
      : network === "avalanche-fuji"
      ? avalanche_pay
      : network === "celo-alfajores"
      ? celo_pay
      : "";

  const [allowance, setAllowance] = useState(0);
  const [balance, setBalance] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [gas, setGasFee] = useState(0);

  const createPayContract = async () => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    const payContract = new ethers.Contract(caddress, sendABI, signer);
    return payContract;
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

    const usdcContract = new ethers.Contract(caddress_ausdc, erc20ABI, signer);
    return usdcContract;
  };

  const allowanceCheck = async () => {
    const contract = await createUSDContract();
    if (caddress === "") {
      return toast.error("Please connect to a supported chain");
    }
    const amount = await contract.allowance(address, caddress);
    const balance = await contract.balanceOf(address);
    setBalance(balance / 10 ** 6);
    setAllowance(amount / 10 ** 6);
  };

  const sendAusdc = async (evt) => {
    evt.preventDefault();
    const contract = await createPayContract();
    if (amountRef.current.value === "") {
      return toast.error("Please enter aUSDC amount");
    }
    if (walletRef.current.value === "") {
      return toast.error("Please enter recipient wallet address");
    }
    if (chainRef.current.value === "") {
      return toast.error("Please select recipient chain");
    }

    const amount = ethers.utils.parseUnits(amountRef.current.value, 6);
    const wallet = [walletRef.current.value];
    const chainT = chainRef.current.value;

    const caddress =
      chainT === "Binance"
        ? bnb_pay
        : chainT === "Polygon"
        ? polygon_pay
        : chainT === "Avalanche"
        ? avalanche_pay
        : chainT === "celo-alfajores"
        ? celo_pay
        : "";

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
    const id = toast.loading("Transaction in progress..");

    try {
      const tx = await contract.sendToMany(
        chainT,
        caddress,
        wallet,
        "aUSDC",
        amount,
        {
          value: gasFee,
        }
      );

      await tx.wait();
      amountRef.current.value = "";
      walletRef.current.value = "";
      chainRef.current.value = "Select Chain";
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
  }, [allowance, network]);

  return (
    <div>
      <Header />

      <div className="flex flex-col lg:flex-row w-full justify-between mt-10 lg:mt-32 mx-auto sm:w-2/3">
        <div>
          <h1 className="text-4xl sm:text-5xl mt-10 text-white text-gradient py-1 text-center lg:text-left">
            <div className="pb-5">Send Crypto</div> <div>Across Chains</div>
          </h1>
        </div>
        <div className="flex">
          <div className="p-3 flex mx-auto justify-end items-start flex-col rounded-xl h-40 sm:w-72 w-9/12 my-5 eth-card .white-glassmorphism ">
            <div className="flex justify-between flex-col w-full h-full">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full border-2 border-white flex justify-center items-center">
                  <SiEthereum fontSize={21} color="#fff" />
                </div>
                <BsInfoCircle fontSize={17} color="#fff" />
              </div>
              <div>
                <p className="text-white font-light text-sm">
                  {address?.slice(0, 8)}...{address?.slice(address?.length - 6)}
                </p>
                <p className="text-white font-semibold text-lg mt-1">
                  {chain?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-10  sm:w-9/12 lg:w-5/12 w-full mx-auto mt-20 mb-10 flex flex-col justify-start items-center blue-glassmorphism">
        <select className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism">
          <option>aUSDC</option>
        </select>
        <input
          value={`Balance - ${balance} aUSDC`}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        />
        <select
          ref={chainRef}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        >
          <option>Select Chain</option>
          <option> Polygon </option>
          <option>Avalanche</option>
          <option>Binance</option>
          <option>Celo</option>
        </select>
        <input
          placeholder="Address To"
          ref={walletRef}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        />
        <input
          placeholder="Amount"
          ref={amountRef}
          className="my-2 w-full rounded p-4 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
        />
        <input
          value={`GasFee - 1000aUSDC`}
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
