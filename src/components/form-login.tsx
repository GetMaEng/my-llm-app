'use client'

import Link from 'next/link'

function FormLogin() {
  return (
    <>
    <div className='h-screen bg-gray-100 flex justify-center items-center'>
        <div className='w-100 h-150 p-5 bg-white rounded-xl shadow-lg flex flex-col items-center'>
            <form action="" className='w-full'>
                <header className='text-3xl text-center font-bold my-10'>
                    <h1>Login</h1>
                </header>
                <section className='w-full'>
                    <label htmlFor="" className='font-bold'>Email</label> <br />
                    <input type="text" placeholder='Enter your email' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/> <br />
                    <label htmlFor="" className='font-bold'>Password</label> <br />
                    <input type="password" placeholder='Enter your password' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/>
                </section>
                <button className='flex justify-center gap-3 bg-blue-500 text-white font-bold w-full  py-3 rounded-3xl cursor-pointer hover:bg-blue-600'>
                    Login
                </button>
            </form>
            <div className='flex gap-5 mt-10'>
                <p>Don't have an account</p><Link href={'/register'} className='text-blue-500 hover:underline hover:text-blue-600'>register</Link>
            </div>
        </div>
    </div>
    </>
  )
}

export default FormLogin