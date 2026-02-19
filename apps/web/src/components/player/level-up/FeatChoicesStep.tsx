"use client";

import type { Character } from "@/types/game";
import type { FeatData, FeatChoicesState } from "@/types/level-up";
import { ALL_ABILITIES, ALL_SKILLS } from "@/types/level-up";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatChoicesStepProps {
  feat: FeatData | null;
  featChoices: FeatChoicesState;
  setFeatChoices: React.Dispatch<React.SetStateAction<FeatChoicesState>>;
  character: Character | null;
}

export function FeatChoicesStep({ feat, featChoices, setFeatChoices, character }: FeatChoicesStepProps) {
  if (!feat) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="py-8 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-red-500/50" />
          <p className="text-red-400">Ошибка: данные черты не найдены</p>
          <p className="text-sm text-muted-foreground mt-1">
            Попробуйте вернуться и выбрать черту заново
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!feat.benefits) {
    return (
      <Card className="border-yellow-500/30">
        <CardContent className="py-8 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500/50" />
          <p className="text-yellow-400">Черта: {feat.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Эта черта не требует дополнительных выборов
          </p>
        </CardContent>
      </Card>
    );
  }

  const benefits = feat.benefits;
  const existingSkillProficiencies = character?.skill_proficiencies || [];
  const existingSkillExpertise = character?.skill_expertise || [];

  // Determine which abilities are available for selection
  const availableAbilities = benefits.ability_increase?.options
    ? ALL_ABILITIES.filter(a => benefits.ability_increase!.options!.includes(a.key))
    : ALL_ABILITIES;

  // Available skills for proficiency (exclude already proficient)
  const availableSkillsForProficiency = ALL_SKILLS.filter(
    s => !existingSkillProficiencies.includes(s.key)
  );

  // Available skills for expertise (must be proficient + not already expertise)
  const availableSkillsForExpertise = ALL_SKILLS.filter(
    s => (existingSkillProficiencies.includes(s.key) || (featChoices.skill_proficiencies || []).includes(s.key))
      && !existingSkillExpertise.includes(s.key)
  );

  const toggleSkillProficiency = (skillKey: string) => {
    const current = featChoices.skill_proficiencies || [];
    const max = benefits.skill_proficiency || 0;

    if (current.includes(skillKey)) {
      setFeatChoices(prev => ({
        ...prev,
        skill_proficiencies: current.filter(s => s !== skillKey),
      }));
    } else if (current.length < max) {
      setFeatChoices(prev => ({
        ...prev,
        skill_proficiencies: [...current, skillKey],
      }));
    }
  };

  const toggleSkillExpertise = (skillKey: string) => {
    const current = featChoices.skill_expertise || [];
    const max = benefits.skill_expertise || 0;

    if (current.includes(skillKey)) {
      setFeatChoices(prev => ({
        ...prev,
        skill_expertise: current.filter(s => s !== skillKey),
      }));
    } else if (current.length < max) {
      setFeatChoices(prev => ({
        ...prev,
        skill_expertise: [...current, skillKey],
      }));
    }
  };

  return (
    <Card className="border-purple-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-purple-500" />
          <CardTitle>Выбор для черты: {feat.name}</CardTitle>
        </div>
        <CardDescription>
          Сделайте необходимые выборы для этой черты
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ability Choice */}
        {(benefits.ability_increase?.choice || (benefits.ability_increase?.options && benefits.ability_increase.options.length > 0)) && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Увеличить характеристику на +{benefits.ability_increase?.amount || 1}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {availableAbilities.map(ability => {
                const currentValue = character?.abilities?.[ability.key as keyof typeof character.abilities] || 10;
                const isSelected = featChoices.ability === ability.key;
                const isMaxed = currentValue >= 20;

                return (
                  <div
                    key={ability.key}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : isMaxed
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-purple-500/50"
                    )}
                    onClick={() => {
                      if (!isMaxed) {
                        setFeatChoices(prev => ({
                          ...prev,
                          ability: ability.key,
                          // For Resilient, saving throw matches ability
                          saving_throw: ability.key,
                        }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ability.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{currentValue}</span>
                        {isSelected && (
                          <span className="text-green-500">&rarr; {currentValue + (benefits.ability_increase?.amount || 1)}</span>
                        )}
                        {isMaxed && (
                          <Badge variant="outline" className="text-xs text-yellow-500">MAX</Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-purple-500 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show saving throw proficiency note for Resilient */}
            {benefits.saving_throw_proficiency && typeof benefits.saving_throw_proficiency === 'object' && featChoices.ability && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-green-400">
                  &check; Вы получите владение спасброском {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Skill Proficiency Choice */}
        {benefits.skill_proficiency && benefits.skill_proficiency > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Выберите навыки для владения
              </Label>
              <Badge variant={
                (featChoices.skill_proficiencies?.length || 0) === benefits.skill_proficiency
                  ? "default" : "outline"
              } className={cn(
                (featChoices.skill_proficiencies?.length || 0) === benefits.skill_proficiency && "bg-green-500"
              )}>
                {featChoices.skill_proficiencies?.length || 0} / {benefits.skill_proficiency}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableSkillsForProficiency.map(skill => {
                const isSelected = (featChoices.skill_proficiencies || []).includes(skill.key);
                const canSelect = isSelected || (featChoices.skill_proficiencies || []).length < benefits.skill_proficiency!;

                return (
                  <div
                    key={skill.key}
                    className={cn(
                      "p-2 rounded-lg border cursor-pointer transition-all text-sm",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : canSelect
                          ? "border-border hover:border-purple-500/50"
                          : "border-border opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => canSelect && toggleSkillProficiency(skill.key)}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="h-3 w-3 text-purple-500" />}
                      <span>{skill.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skill Expertise Choice */}
        {benefits.skill_expertise && benefits.skill_expertise > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Выберите навыки для экспертизы
              </Label>
              <Badge variant={
                (featChoices.skill_expertise?.length || 0) === benefits.skill_expertise
                  ? "default" : "outline"
              } className={cn(
                (featChoices.skill_expertise?.length || 0) === benefits.skill_expertise && "bg-green-500"
              )}>
                {featChoices.skill_expertise?.length || 0} / {benefits.skill_expertise}
              </Badge>
            </div>
            {availableSkillsForExpertise.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сначала выберите навык для владения выше, чтобы получить для него экспертизу
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSkillsForExpertise.map(skill => {
                  const isSelected = (featChoices.skill_expertise || []).includes(skill.key);
                  const canSelect = isSelected || (featChoices.skill_expertise || []).length < benefits.skill_expertise!;

                  return (
                    <div
                      key={skill.key}
                      className={cn(
                        "p-2 rounded-lg border cursor-pointer transition-all text-sm",
                        isSelected
                          ? "border-amber-500 bg-amber-500/10"
                          : canSelect
                            ? "border-border hover:border-amber-500/50"
                            : "border-border opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => canSelect && toggleSkillExpertise(skill.key)}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="h-3 w-3 text-amber-500" />}
                        <span>{skill.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">&diams; x2</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cantrip Choice */}
        {benefits.cantrip && typeof benefits.cantrip === 'object' && benefits.cantrip.choice && feat.available_cantrips && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-indigo-500">&starf;</span>
              Выберите заговор
            </Label>
            {benefits.cantrip.attack_roll_required && (
              <p className="text-sm text-muted-foreground">
                Заговор должен требовать броска атаки
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {feat.available_cantrips.map(cantrip => {
                const isSelected = featChoices.cantrip === cantrip.slug;
                const isKnown = (character?.known_spells || []).some(
                  s => (typeof s === 'object' && s !== null && 'slug' in s ? (s as { slug: string }).slug : s) === cantrip.slug
                );

                return (
                  <div
                    key={cantrip.slug}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10"
                        : isKnown
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-indigo-500/50"
                    )}
                    onClick={() => {
                      if (!isKnown) {
                        setFeatChoices(prev => ({ ...prev, cantrip: cantrip.slug }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cantrip.name}</span>
                        {cantrip.school && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {cantrip.school}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isKnown && <Badge variant="secondary" className="text-xs">Уже знаете</Badge>}
                        {isSelected && <Check className="h-4 w-4 text-indigo-500" />}
                      </div>
                    </div>

                    {/* Spell parameters */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {cantrip.casting_time && (
                        <span>&clock; {cantrip.casting_time}</span>
                      )}
                      {cantrip.range && (
                        <span>&rulex; {cantrip.range}</span>
                      )}
                      {cantrip.duration && cantrip.duration !== "Мгновенная" && (
                        <span>&hourglass; {cantrip.duration}</span>
                      )}
                      {cantrip.effects?.damage && (
                        <span className="text-red-400">
                          &swords; {cantrip.effects.damage.dice} {cantrip.effects.damage.type}
                        </span>
                      )}
                      {cantrip.effects?.healing && (
                        <span className="text-green-400">
                          &hearts; {cantrip.effects.healing.dice}
                        </span>
                      )}
                      {cantrip.effects?.save && (
                        <span className="text-yellow-400">
                          &target; СП {cantrip.effects.save.ability}
                        </span>
                      )}
                    </div>

                    {cantrip.classes && cantrip.classes.length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {cantrip.classes.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {feat.available_cantrips.length === 0 && (
              <p className="text-sm text-yellow-500">
                Нет доступных заговоров для выбора
              </p>
            )}
          </div>
        )}

        {/* Spell Choice */}
        {benefits.spell && typeof benefits.spell === 'object' && benefits.spell.choice && feat.available_spells && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-violet-500">&scroll;</span>
              Выберите заклинание {benefits.spell.level && `${benefits.spell.level} уровня`}
            </Label>
            {benefits.spell.school && (
              <p className="text-sm text-muted-foreground">
                Школа: {benefits.spell.school}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {feat.available_spells.map(spell => {
                const isSelected = featChoices.spell === spell.slug;
                const isKnown = (character?.known_spells || []).some(
                  s => (typeof s === 'object' && s !== null && 'slug' in s ? (s as { slug: string }).slug : s) === spell.slug
                );

                return (
                  <div
                    key={spell.slug}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-violet-500 bg-violet-500/10"
                        : isKnown
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-violet-500/50"
                    )}
                    onClick={() => {
                      if (!isKnown) {
                        setFeatChoices(prev => ({ ...prev, spell: spell.slug }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{spell.name}</span>
                        {spell.school && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {spell.school}
                          </Badge>
                        )}
                        {spell.level !== undefined && spell.level > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {spell.level} ур.
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isKnown && <Badge variant="secondary" className="text-xs">Уже знаете</Badge>}
                        {isSelected && <Check className="h-4 w-4 text-violet-500" />}
                      </div>
                    </div>

                    {/* Spell parameters */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {spell.casting_time && (
                        <span>&clock; {spell.casting_time}</span>
                      )}
                      {spell.range && (
                        <span>&rulex; {spell.range}</span>
                      )}
                      {spell.duration && spell.duration !== "Мгновенная" && (
                        <span>&hourglass; {spell.duration}</span>
                      )}
                      {spell.effects?.damage && (
                        <span className="text-red-400">
                          &swords; {spell.effects.damage.dice} {spell.effects.damage.type}
                        </span>
                      )}
                      {spell.effects?.healing && (
                        <span className="text-green-400">
                          &hearts; {spell.effects.healing.dice}
                        </span>
                      )}
                      {spell.effects?.save && (
                        <span className="text-yellow-400">
                          &target; СП {spell.effects.save.ability}
                        </span>
                      )}
                    </div>

                    {spell.classes && spell.classes.length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {spell.classes.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary of what will be gained */}
        <Separator />
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Вы получите:</Label>
          <div className="flex flex-wrap gap-2">
            {featChoices.ability && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                +{benefits.ability_increase?.amount || 1} {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
              </Badge>
            )}
            {benefits.saving_throw_proficiency && featChoices.ability && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Спасбросок: {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
              </Badge>
            )}
            {(featChoices.skill_proficiencies || []).map(sk => (
              <Badge key={sk} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                &bull; {ALL_SKILLS.find(s => s.key === sk)?.name}
              </Badge>
            ))}
            {(featChoices.skill_expertise || []).map(sk => (
              <Badge key={sk} className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                &diams; {ALL_SKILLS.find(s => s.key === sk)?.name}
              </Badge>
            ))}
            {featChoices.cantrip && feat.available_cantrips && (
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                &starf; {feat.available_cantrips.find(c => c.slug === featChoices.cantrip)?.name}
              </Badge>
            )}
            {featChoices.spell && feat.available_spells && (
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                &scroll; {feat.available_spells.find(s => s.slug === featChoices.spell)?.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
