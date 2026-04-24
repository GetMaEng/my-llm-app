'use client'

import Link from 'next/link'
import { z } from "zod";
import { useState } from "react";

function FormLogin() {

    const [errors, setErrors] = useState<{
        email?: string[];
        password?: string[];
    }>({});

    // Define schema
    const loginSchema = z.object({
        email: z.string().email({message: "Please enter a valid email."}).trim(),
        password: z.string().min(6, {message: 'Password must be at least 6 characters.'})
    });
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const validate = loginSchema.safeParse({
            email,
            password
        });

        if (!validate.success) {
            const fieldErrors = validate.error.flatten().fieldErrors;
            setErrors(fieldErrors);
            return;
        }

        setErrors({}); // clear errors
        console.log('success', email, password);
    };

  return (
    <>
    <div className='h-screen bg-gray-100 flex justify-center items-center'>
        <div className='w-100 h-135 p-5 bg-white rounded-xl shadow-lg flex flex-col items-center'>
            <form onSubmit={handleSubmit} className='w-full'>
                <header className='text-3xl text-center font-bold my-5'>
                    <h1>Login</h1>
                </header>
                <section className='w-full'>
                    <label className='font-bold'>Email</label> <br />
                    <input name="email" type="email" placeholder='Enter your email' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/> <br />
                    {errors.email && (<p className="text-red-500 text-sm -mt-4 mb-4">{errors.email[0]}</p>)}
                    <label className='font-bold'>Password</label> <br />
                    <input name="password" type="password" placeholder='Enter your password' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/>
                    {errors.password && (<p className="text-red-500 text-sm -mt-4 mb-4">{errors.password[0]}</p>)}
                </section>
                <button type='submit' className='flex justify-center gap-3 bg-blue-500 text-white font-bold w-full  py-3 rounded-3xl cursor-pointer hover:bg-blue-600'>
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