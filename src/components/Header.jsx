import React from "react";
import { HiMenuAlt4 } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

export default function Header() {
  const [toggleMenu, setToggleMenu] = React.useState(false);

  return (
    <nav className="w-full flex md:justify-center justify-between items-center p-4">
      <div className="md:flex-[0.5] flex-initial justify-center items-center">
        <Link to="/">
          <div className="w-32 text-lg cursor-pointer">Intersend</div>
        </Link>
      </div>
      <ul className="text-white md:flex hidden list-none flex-row justify-between items-center flex-initial">
        <Link to="/">
          <li className={`mx-4 cursor-pointer my-2 text-lg`}>Send</li>
        </Link>
        <li className={`mx-4 cursor-pointer my-2 text-lg`}>Request</li>
        <Link to="/payment">
          <li className={`mx-4 cursor-pointer my-2 text-lg`}>Payment Link</li>
        </Link>
        <ConnectButton />
      </ul>
      <div className="flex relative">
        {!toggleMenu && (
          <HiMenuAlt4
            fontSize={28}
            className="text-white md:hidden cursor-pointer"
            onClick={() => setToggleMenu(true)}
          />
        )}
        {toggleMenu && (
          <AiOutlineClose
            fontSize={28}
            className="text-white md:hidden cursor-pointer"
            onClick={() => setToggleMenu(false)}
          />
        )}
        {toggleMenu && (
          <ul
            className="z-10 fixed -top-0 -right-2 p-3 w-[70vw] h-screen shadow-2xl md:hidden list-none
          flex flex-col justify-start items-end rounded-md blue-glassmorphism text-white animate-slide-in"
          >
            <li className="text-xl w-full my-2">
              <AiOutlineClose onClick={() => setToggleMenu(false)} />
            </li>

            <Link to="/">
              <li className={`mx-4 cursor-pointer my-2 text-lg`}>Send</li>
            </Link>

            <li className={`mx-4 cursor-pointer my-2 text-lg`}>Request</li>
            <Link to="/payment">
              <li className={`mx-4 cursor-pointer my-2 text-lg`}>
                Payment Link
              </li>
            </Link>

            <ConnectButton />
          </ul>
        )}
      </div>
    </nav>
  );
}
