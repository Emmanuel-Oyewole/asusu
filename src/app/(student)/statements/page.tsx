"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StatementsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function download() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/statements/me/pdf?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Statements</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Download your transaction statement
          </CardTitle>
          <CardDescription>
            Leave dates blank to download your full history.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-medium">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-md border border-input bg-input px-3 text-sm"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-medium">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-md border border-input bg-input px-3 text-sm"
              />
            </div>
          </div>
          <Button onClick={download}>
            <FileDown className="size-4" />
            Generate PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
