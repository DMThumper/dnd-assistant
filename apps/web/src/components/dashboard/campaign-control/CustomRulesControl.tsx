"use client";

import { useState } from "react";
import type { Character, CustomRule, CustomRuleEffect } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Scroll, Plus, X, Pencil, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CustomRulesControlProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export function CustomRulesControl({ character, onCharacterUpdate }: CustomRulesControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<CustomRule | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [rulePermanent, setRulePermanent] = useState(false);
  const [ruleSource, setRuleSource] = useState("");
  const [ruleEffects, setRuleEffects] = useState<CustomRuleEffect[]>([]);

  const customRules = character.custom_rules || [];

  // Reset form
  const resetForm = () => {
    setRuleName("");
    setRuleDescription("");
    setRulePermanent(false);
    setRuleSource("");
    setRuleEffects([]);
  };

  // Open edit modal
  const openEditModal = (rule: CustomRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleDescription(rule.description || "");
    setRulePermanent(rule.permanent);
    setRuleSource(rule.source || "");
    setRuleEffects(rule.effects || []);
    setAddModalOpen(true);
  };

  // Add new effect
  const addEffect = () => {
    setRuleEffects([
      ...ruleEffects,
      { type: "bonus", category: "custom", description: "" }
    ]);
  };

  // Remove effect
  const removeEffect = (index: number) => {
    setRuleEffects(ruleEffects.filter((_, i) => i !== index));
  };

  // Update effect
  const updateEffect = (index: number, field: keyof CustomRuleEffect, value: string | number) => {
    const updated = [...ruleEffects];
    updated[index] = { ...updated[index], [field]: value };
    setRuleEffects(updated);
  };

  // Save rule (add or update)
  const handleSaveRule = async () => {
    if (!ruleName.trim()) {
      toast.error("Введите название правила");
      return;
    }

    setIsLoading(true);
    try {
      const rule: CustomRule = {
        id: editingRule?.id || generateId(),
        name: ruleName,
        description: ruleDescription || undefined,
        permanent: rulePermanent,
        source: ruleSource || undefined,
        effects: ruleEffects,
        applied_at: editingRule?.applied_at || new Date().toISOString(),
      };

      const action = editingRule ? "update" : "add";
      const response = await api.manageCustomRule(character.id, action, rule);
      onCharacterUpdate(response.data.character);

      toast.success(editingRule ? "Правило обновлено" : "Правило добавлено");
      resetForm();
      setEditingRule(null);
      setAddModalOpen(false);
    } catch (error) {
      console.error("Failed to save rule:", error);
      toast.error("Не удалось сохранить правило");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete rule
  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return;

    setIsLoading(true);
    try {
      const response = await api.manageCustomRule(character.id, "remove", deleteConfirmRule);
      onCharacterUpdate(response.data.character);
      toast.info(`${deleteConfirmRule.name} удалено`);
      setDeleteConfirmRule(null);
    } catch (error) {
      console.error("Failed to delete rule:", error);
      toast.error("Не удалось удалить правило");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-zinc-100">Кастомные правила</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setEditingRule(null);
            setAddModalOpen(true);
          }}
          className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {/* Rules list */}
      {customRules.length === 0 ? (
        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
          <p className="text-sm text-zinc-500">Нет кастомных правил</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customRules.map((rule) => {
            const hasPenalties = rule.effects.some(e => e.type === "penalty");
            const hasBonuses = rule.effects.some(e => e.type === "bonus");
            const isExpanded = expandedRule === rule.id;

            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-lg border transition-colors",
                  hasPenalties && !hasBonuses
                    ? "bg-red-500/5 border-red-500/20"
                    : hasBonuses && !hasPenalties
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-purple-500/5 border-purple-500/20"
                )}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  className="w-full p-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-100">{rule.name}</span>
                    {rule.permanent && (
                      <Badge variant="outline" className="text-xs bg-zinc-700/50 border-zinc-600 text-zinc-400">
                        постоянно
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Effect indicators */}
                    <div className="flex gap-1">
                      {rule.effects.filter(e => e.type === "bonus").length > 0 && (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                          +{rule.effects.filter(e => e.type === "bonus").length}
                        </Badge>
                      )}
                      {rule.effects.filter(e => e.type === "penalty").length > 0 && (
                        <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                          -{rule.effects.filter(e => e.type === "penalty").length}
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    {rule.description && (
                      <p className="text-sm text-zinc-400">{rule.description}</p>
                    )}
                    {rule.source && (
                      <p className="text-xs text-zinc-500">Источник: {rule.source}</p>
                    )}

                    {/* Effects */}
                    {rule.effects.length > 0 && (
                      <div className="space-y-1">
                        {rule.effects.map((effect, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "text-sm px-2 py-1 rounded",
                              effect.type === "bonus"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            )}
                          >
                            {effect.type === "bonus" ? "+" : "-"}{effect.value || ""} {effect.description}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-700/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(rule)}
                        className="text-zinc-400 hover:text-zinc-100"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Изменить
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmRule(rule)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingRule ? "Изменить правило" : "Добавить правило"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Перки, увечья, проклятия, благословения...
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Название *</Label>
              <Input
                placeholder="Например: Потеря глаза"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Описание</Label>
              <Textarea
                placeholder="Описание правила..."
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Источник</Label>
              <Input
                placeholder="Например: Ловушка в подземелье"
                value={ruleSource}
                onChange={(e) => setRuleSource(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Постоянное</Label>
              <Switch checked={rulePermanent} onCheckedChange={setRulePermanent} />
            </div>

            {/* Effects */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">Эффекты</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addEffect}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
              </div>

              {ruleEffects.map((effect, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <Select
                    value={effect.type}
                    onValueChange={(v) => updateEffect(idx, "type", v as "bonus" | "penalty")}
                  >
                    <SelectTrigger className="w-28 bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="bonus" className="text-emerald-400">Бонус</SelectItem>
                      <SelectItem value="penalty" className="text-red-400">Штраф</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="±"
                    value={effect.value || ""}
                    onChange={(e) => updateEffect(idx, "value", parseInt(e.target.value) || 0)}
                    className="w-16 bg-zinc-800 border-zinc-700 text-zinc-100"
                  />

                  <Input
                    placeholder="Описание эффекта"
                    value={effect.description || ""}
                    onChange={(e) => updateEffect(idx, "description", e.target.value)}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEffect(idx)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={isLoading || !ruleName.trim()}
              onClick={handleSaveRule}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRule ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmRule} onOpenChange={() => setDeleteConfirmRule(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Удалить правило?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Правило "{deleteConfirmRule?.name}" будет удалено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
