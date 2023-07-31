import { useState, useEffect, } from "react";
import Header from "../components/Header";
import { SiEthereum } from "react-icons/si";
import { BsInfoCircle } from "react-icons/bs";
import { useAccount, useNetwork } from "wagmi";
import { ethers } from "ethers";
import receiveABI from "../../abis/receive.json";
import { CopyToClipboard } from "react-copy-to-clipboard";


import { toast } from "react-toastify";

export default function Payment() {
    const { chain } = useNetwork();
    const { address } = useAccount();

    const [history, setHistory] = useState([]);

    const createReceiveContract = async () => {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const ch = chain.network;

        const caddress =
            ch === "bsc-testnet"
                ? "0x1c79E559ab894F098881793c0479b5de6d8731c4"
                : ch === "maticmum"
                    ? "0xFF8efDf68a5c0E2f5b776416FA8b087dA32808c9"
                    : ch === "avalanche-fuji"
                        ? "0x12ce743624ddfe6c138f48896cfd28c397554e28"
                        : ch === "celo-alfajores"
                            ? "0xaE6eA4945F206C22122E63Dd5387982F23121f36"
                            : "";

        const receiveContract = new ethers.Contract(caddress, receiveABI, signer);
        return receiveContract;
    };

    const getHistory = async () => {
        const contract = await createReceiveContract();
        const hist = await contract.payHistory();
        console.log(hist);
        setHistory(hist);
    };


    useEffect(() => {
        getHistory()
    }, []);

    return (
        <div>
            <Header />

            <div className="flex flex-col lg:flex-row w-full justify-between mt-10 lg:mt-32 mx-auto sm:w-2/3">
                <div>
                    <h1 className="text-4xl sm:text-5xl mt-10 text-white text-gradient py-1 text-center lg:text-left">
                        <div className="pb-5">Receive Crypto</div> <div>Across Chains</div>
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

            <CopyToClipboard
                text={`http://127.0.0.1:5176/receive?address=${address}&&chain=${chain?.network}`}
            >
                <button
                    onClick={() => toast.info("Payment Link copied")}
                    className="text-white w-9/12 mx-auto block mt-2 border-[1px] p-2 border-[#3d4f7c] hover:bg-[#3d4f7c] rounded-full cursor-pointer"
                >
                    Copy payment link to receive payment from Binance || Polygon ||
                    Avax || Celo
                </button>
            </CopyToClipboard>

            <section style={{ marginTop: "100px" }} className="">
                <table className="mx-auto w-9/12 text-white px-3">
                    <tbody>
                        <tr className="">
                            <th >Id</th>
                            <th >Amount</th>
                            <th >Sender</th>
                            <th >Receiver</th>
                        </tr>
                        {history.map((item) => {
                            return (
                                <tr className="px-4" key={item.id}>
                                    <td className="py-4">{Number(ethers.BigNumber.from(item.id))}</td>
                                    <td>
                                        {Number(
                                            ethers.BigNumber.from(item.amount) / 10 ** 6
                                        ).toFixed(5)}{" "}
                                        aUSDC
                                    </td>
                                    <td>{item.sender}</td>
                                    <td>{item.receiver}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>


        </div>
    );
}
