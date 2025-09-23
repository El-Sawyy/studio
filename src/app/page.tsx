"use client";

import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db } from '@/lib/firebase';
import LoginPage from '@/components/auth/login-page';
import AdminView from '@/components/admin/admin-view';
import AgentView from '@/components/agent/agent-view';
import { AUDITOR_EMAILS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut } from 'lucide-react';

export default function Home() {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [agentId, setAgentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((userAuth) => {
            if (userAuth) {
                setUser(userAuth);
                const unsubscribeRole = db.collection('users').doc(userAuth.uid).onSnapshot(userDoc => {
                    setLoading(false);
                    setDbError(null);
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        if (data) {
                            setUserRole(data.role);
                            setAgentId(data.agentId || null);
                        }
                    } else {
                        setUserRole(null);
                    }
                }, (error) => {
                     console.error("Error fetching user role:", error);
                     if (error.code === 'permission-denied') {
                         setDbError("Could not verify your role due to a database permissions issue. Please contact your administrator and ask them to verify the Firestore security rules.");
                     } else {
                         setDbError("An unexpected error occurred while fetching your user role.");
                     }
                     setUserRole(null);
                     setLoading(false);
                });
                return () => unsubscribeRole();
            } else {
                setUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading...</div>;
    }
    
    if (dbError && user) {
         return (
             <div className="flex items-center justify-center min-h-screen flex-col bg-background text-foreground">
                 <Alert variant="destructive" className="max-w-lg text-center">
                     <AlertTitle>Permissions Error!</AlertTitle>
                     <AlertDescription>{dbError}</AlertDescription>
                 </Alert>
                 <Button onClick={() => auth.signOut()} className="mt-4" variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                 </Button>
             </div>
         );
    }

    if (!user) {
        return <LoginPage />;
    }
    if (userRole === 'admin' || (user.email && AUDITOR_EMAILS.includes(user.email))) {
        return <AdminView user={user} userRole={userRole}/>;
    }
    if (userRole === 'agent') {
        return <AgentView user={user} agentId={agentId} />;
    }
    return (
         <div className="flex items-center justify-center min-h-screen flex-col bg-background text-foreground">
             <p className="mb-4">Your account role is not yet assigned. Please contact an administrator.</p>
             <Button onClick={() => auth.signOut()} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
             </Button>
         </div>
    );
}
