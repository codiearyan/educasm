import Image from "next/image";

export const DottedFace = () => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <Image
        src={"/dottedface.gif"}
        alt="loading..."
        width={350}
        height={350}
        priority
      />
    </div>
  );
}; 