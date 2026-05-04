'use client'

import Link from 'next/link'
import { useRouter } from "next/navigation";
import { useState } from 'react';
import z from 'zod';

function FormRegister() {

    const [errors, setErrors] = useState<{
        username?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
    }>({});

    const router = useRouter();

    // Define schema
    const registerSchema = z.object({
        username: z.string().min(5, { message: 'Username must be at least 5 characters.' }),
        email: z.string().email({ message: "Please enter a valid email." }).trim(),
        password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Confirm password doesn't match.",
        path: ["confirmPassword"],
    });
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const validate = registerSchema.safeParse({
            username,
            email,
            password,
            confirmPassword
        });

        if (!validate.success) {
            const fieldErrors = validate.error.flatten().fieldErrors;
            setErrors(fieldErrors);
            return;
        }

        setErrors({}); // clear errors
        
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        })

        if (!res.ok) {
            const data = await res.json();
            setErrors({ email: [data.message || "Something went wrong"] });
            return;
        }

        if (res.status === 409) {
            setErrors({ email: ['This email already existed.'] });
            return;
        }

        console.log("Register successfully");

        router.push("/login");
        
    };

  return (
    <>
    <div className='h-screen bg-gray-100 flex justify-center items-center'>
        <div className='w-100 h-screen p-5 bg-white rounded-xl shadow-lg flex flex-col items-center'>
            <form onSubmit={handleSubmit} className='w-full'>
                <header className='text-3xl text-center font-bold my-5'>
                    <h1>Register</h1>
                </header>
                <section className='w-full'>
                    <label htmlFor="" className='font-bold'>Username</label> <br />
                    <input type="text" name='username' placeholder='Enter your username' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/> <br />
                    {errors.username && (<p className="text-red-500 text-sm -mt-4 mb-4">{errors.username[0]}</p>)}
                    <label htmlFor="" className='font-bold'>Email</label> <br />
                    <input type="text" name='email' placeholder='Enter your email' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/> <br />
                    {errors.email && (<p className="text-red-500 text-sm -mt-4 mb-4">{errors.email[0]}</p>)}
                    <label htmlFor="" className='font-bold'>Password</label> <br />
                    <input type="password" name='password' placeholder='Enter your password' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/> <br />
                    {errors.password && (<p className="text-red-500 text-sm -mt-4 mb-4">{errors.password[0]}</p>)}
                    <label htmlFor="" className='font-bold'>Confirm Password</label> <br />
                    <input type="password" name='confirmPassword' placeholder='Enter your confirm password' className='w-full px-3 py-2 mt-4 mb-8 bg-gray-100 shadow-lg rounded-xl focus:outline-none focus:ring-0 border-none'/>
                    {errors.confirmPassword && (<p className="text-red-500 text-sm -mt-4 mb-4">{errors.confirmPassword[0]}</p>)}
                </section>
                <button type='submit' className='flex justify-center gap-3 bg-blue-500 text-white font-bold w-full  py-3 rounded-3xl cursor-pointer hover:bg-blue-600'>
                    Register
                </button>
            </form>
            <div className='flex gap-5 mt-10'>
                <p>Already have an account</p><Link href={'/login'} className='text-blue-500 hover:underline hover:text-blue-600'>login</Link>
            </div>
        </div>
    </div>
    </>
  )
}

export default FormRegister