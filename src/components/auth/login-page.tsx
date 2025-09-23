"use client";

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { TEAMS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggleButton } from '@/components/shared/theme-toggle-button';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [team, setTeam] = useState(TEAMS[0]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                // 1. Create user in Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const { user } = userCredential;

                if (user) {
                    // 2. Create agent profile first to get its ID
                    const agentRef = await db.collection('agents').add({
                        name,
                        employeeId,
                        email: user.email,
                        team,
                        createdAt: new Date().toISOString(),
                    });

                    // 3. Create user document with role and agentId
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        role: 'agent',
                        agentId: agentRef.id // Link user to their agent profile
                    });
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <ThemeToggleButton />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">{isLogin ? 'Log In' : 'Sign Up'}</CardTitle>
                    <CardDescription className="text-center">to continue to Tempo Triumph</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input id="employeeId" type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="team">Team</Label>
                                    <Select value={team} onValueChange={setTeam}>
                                        <SelectTrigger id="team">
                                            <SelectValue placeholder="Select a team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="pl-1">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </Button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
