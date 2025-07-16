import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface SessionTestInfo {
  message: string;
  sessionInfo: {
    hasSession: boolean;
    sessionId: string | null;
    user: any;
    loginTime: string | null;
    cookie: {
      secure: boolean;
      httpOnly: boolean;
      maxAge: number | null;
      sameSite: string | null;
      domain: string | null;
    };
    timestamp: string;
  };
  authenticated: boolean;
}

export default function SessionTest() {
  const [testEnabled, setTestEnabled] = useState(false);

  const { data: sessionTest, isLoading, refetch } = useQuery<SessionTestInfo>({
    queryKey: ["/api/auth/session-test"],
    enabled: testEnabled,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleTest = () => {
    setTestEnabled(true);
    refetch();
  };

  const handleClearTest = () => {
    setTestEnabled(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Session Test
          <Badge variant={sessionTest?.authenticated ? "default" : "destructive"}>
            {sessionTest?.authenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleTest} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Session"}
          </Button>
          <Button onClick={handleClearTest} variant="outline">
            Clear Test
          </Button>
        </div>

        {sessionTest && (
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-green-600">
                {sessionTest.message}
              </p>
              <p className="text-xs text-muted-foreground">
                Test performed at: {new Date(sessionTest.sessionInfo.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Session Info</h4>
                <div className="space-y-1 text-sm">
                  <p>Has Session: <Badge variant={sessionTest.sessionInfo.hasSession ? "default" : "destructive"}>
                    {sessionTest.sessionInfo.hasSession ? "Yes" : "No"}
                  </Badge></p>
                  <p>Session ID: {sessionTest.sessionInfo.sessionId || "None"}</p>
                  <p>Login Time: {sessionTest.sessionInfo.loginTime || "None"}</p>
                  <p>User: {sessionTest.sessionInfo.user?.id || "None"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Cookie Settings</h4>
                <div className="space-y-1 text-sm">
                  <p>Secure: <Badge variant={sessionTest.sessionInfo.cookie.secure ? "default" : "secondary"}>
                    {sessionTest.sessionInfo.cookie.secure ? "Yes" : "No"}
                  </Badge></p>
                  <p>HTTP Only: <Badge variant={sessionTest.sessionInfo.cookie.httpOnly ? "default" : "secondary"}>
                    {sessionTest.sessionInfo.cookie.httpOnly ? "Yes" : "No"}
                  </Badge></p>
                  <p>Max Age: {sessionTest.sessionInfo.cookie.maxAge ? `${Math.floor(sessionTest.sessionInfo.cookie.maxAge / 1000 / 60 / 60)} hours` : "None"}</p>
                  <p>Same Site: {sessionTest.sessionInfo.cookie.sameSite || "None"}</p>
                  <p>Domain: {sessionTest.sessionInfo.cookie.domain || "Browser default"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}