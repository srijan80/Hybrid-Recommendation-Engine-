import Image from "next/image";
import { Home } from '@/app/content/page'
import {Resource}  from '@/app/content/resource'
import Navbar from '@/Components/Navbar'
//hybrid recommendation enginer
export default function Page() {
  return (
    <div>
      <Navbar/>
      <Home/>
      {/* <Resource/> */}
    </div>
  );
}
