import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <div className='py-12 items-center flex flex-col text-xl'>

      <SignIn />
  </div>
  
}