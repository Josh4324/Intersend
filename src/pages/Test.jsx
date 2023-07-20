import React from "react";

export default function Test() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between mx-auto w-9/12 bg-white px-6 py-6 mt-6 rounded">
        <div className="md:w-5/12 w-full bg-black">Hello</div>
        <div className="md:w-5/12 w-full bg-black">Hello</div>
      </div>
    </div>
  );
}
