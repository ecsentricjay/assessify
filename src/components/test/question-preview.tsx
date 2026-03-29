"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  FileCheck,
  Upload,
} from "lucide-react";
import type { ExtractedQuestion } from "@/lib/services/claude.service";

interface QuestionPreviewProps {
  questions: ExtractedQuestion[];
  onImport: (questions: ExtractedQuestion[]) => void;
  onCancel: () => void;
}

export default function QuestionPreview({
  questions: initialQuestions,
  onImport,
  onCancel,
}: QuestionPreviewProps) {
  const [questions, setQuestions] = useState<ExtractedQuestion[]>(initialQuestions);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<ExtractedQuestion | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion({ ...questions[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedQuestion) {
      const updated = [...questions];
      updated[editingIndex] = editedQuestion;
      setQuestions(updated);
      setEditingIndex(null);
      setEditedQuestion(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion(null);
  };

  const handleDelete = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleAddOption = () => {
    if (editedQuestion && editedQuestion.question_type === "mcq") {
      setEditedQuestion({
        ...editedQuestion,
        options: [...(editedQuestion.options || []), ""],
      });
    }
  };

  const handleUpdateOption = (optionIndex: number, value: string) => {
    if (editedQuestion && editedQuestion.options) {
      const updatedOptions = [...editedQuestion.options];
      updatedOptions[optionIndex] = value;
      setEditedQuestion({
        ...editedQuestion,
        options: updatedOptions,
      });
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (editedQuestion && editedQuestion.options) {
      const updatedOptions = editedQuestion.options.filter((_, i) => i !== optionIndex);
      setEditedQuestion({
        ...editedQuestion,
        options: updatedOptions,
      });
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "mcq":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "essay":
        return "Essay";
      default:
        return type;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "mcq":
        return "bg-blue-100 text-primary-blue";
      case "true_false":
        return "bg-green-100 text-success";
      case "essay":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-bg-light text-text-gray";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-blue flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Review Extracted Questions
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {questions.length} question{questions.length !== 1 ? "s" : ""} extracted.
              Review and edit before importing.
            </p>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No questions to display. All questions have been deleted.
            </AlertDescription>
          </Alert>
        ) : (
          questions.map((question, index) => (
            <Card key={index} className="p-4">
              {editingIndex === index && editedQuestion ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Edit Question {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="text-sm font-medium">Question Type</label>
                    <Select
                      value={editedQuestion.question_type}
                      onValueChange={(value: any) =>
                        setEditedQuestion({ ...editedQuestion, question_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="text-sm font-medium">Question Text</label>
                    <Textarea
                      value={editedQuestion.question_text}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          question_text: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  {/* MCQ Options */}
                  {editedQuestion.question_type === "mcq" && (
                    <div>
                      <label className="text-sm font-medium">Options</label>
                      <div className="space-y-2 mt-2">
                        {editedQuestion.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) =>
                                handleUpdateOption(optIndex, e.target.value)
                              }
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveOption(optIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button size="sm" variant="outline" onClick={handleAddOption}>
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Correct Answer */}
                  {(editedQuestion.question_type === "mcq" ||
                    editedQuestion.question_type === "true_false") && (
                    <div>
                      <label className="text-sm font-medium">Correct Answer</label>
                      {editedQuestion.question_type === "mcq" ? (
                        <Select
                          value={editedQuestion.correct_answer || ""}
                          onValueChange={(value) =>
                            setEditedQuestion({
                              ...editedQuestion,
                              correct_answer: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            {editedQuestion.options?.map((_, optIndex) => (
                              <SelectItem
                                key={optIndex}
                                value={String.fromCharCode(65 + optIndex)}
                              >
                                Option {String.fromCharCode(65 + optIndex)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={editedQuestion.correct_answer || ""}
                          onValueChange={(value) =>
                            setEditedQuestion({
                              ...editedQuestion,
                              correct_answer: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="True">True</SelectItem>
                            <SelectItem value="False">False</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="text-sm font-medium">Explanation (Optional)</label>
                    <Textarea
                      value={editedQuestion.explanation || ""}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          explanation: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Provide an explanation for the correct answer"
                    />
                  </div>

                  {/* Marks */}
                  <div>
                    <label className="text-sm font-medium">Marks</label>
                    <Input
                      type="number"
                      min="1"
                      value={editedQuestion.marks}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          marks: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Question {index + 1}</span>
                        <Badge className={getQuestionTypeColor(question.question_type)}>
                          {getQuestionTypeLabel(question.question_type)}
                        </Badge>
                        <Badge variant="outline">{question.marks} marks</Badge>
                        {question.has_image && (
                          <Badge variant="outline" className="bg-purple-50">
                            Has Image
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{question.question_text}</p>

                      {/* Display Options for MCQ */}
                      {question.question_type === "mcq" && question.options && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`text-sm pl-4 ${
                                String.fromCharCode(65 + optIndex) === question.correct_answer
                                  ? "font-semibold text-success"
                                  : ""
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {String.fromCharCode(65 + optIndex) === question.correct_answer && (
                                <span className="ml-2 text-xs">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display Correct Answer for True/False */}
                      {question.question_type === "true_false" && (
                        <p className="text-sm mt-2 font-semibold text-success">
                          Answer: {question.correct_answer}
                        </p>
                      )}

                      {/* Display Explanation */}
                      {question.explanation && (
                        <p className="text-sm text-text-gray mt-2 italic">
                          Explanation: {question.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(index)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end sticky bottom-4 bg-white p-4 border rounded-lg shadow-lg">
        <Button variant="outline" onClick={onCancel}>
          Cancel Import
        </Button>
        <Button onClick={() => onImport(questions)} disabled={questions.length === 0}>
          <Upload className="mr-2 h-4 w-4" />
          Import {questions.length} Question{questions.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}