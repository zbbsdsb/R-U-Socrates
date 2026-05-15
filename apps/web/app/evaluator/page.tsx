"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RotateCcw, Code2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useSettingsStore, DEFAULT_EVALUATOR } from "@/stores/settingsStore";

export default function EvaluatorPage() {
  const { settings, patchSetting, resetSettings } = useSettingsStore();
  const [code, setCode] = useState(settings.customEvaluator);
  const { toast } = useToast();

  const handleSave = () => {
    patchSetting("customEvaluator", code);
    toast({
      type: "success",
      title: "Evaluator saved!",
      description: "Your custom evaluator has been saved to settings.",
    });
  };

  const handleReset = () => {
    setCode(DEFAULT_EVALUATOR);
    patchSetting("customEvaluator", DEFAULT_EVALUATOR);
    toast({
      type: "success",
      title: "Evaluator reset!",
      description: "The evaluator has been reset to the default.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="w-6 h-6" />
            Evaluator Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and customize your own evaluation logic
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Default
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Python Evaluator</CardTitle>
          <CardDescription>
            Edit the evaluator script that scores your candidate solutions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] border-t">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
