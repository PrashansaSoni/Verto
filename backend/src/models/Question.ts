import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import QuestionOption from './QuestionOption';

export interface QuestionAttributes {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'true_false';
  marks: number;
  correct_explanation?: string;
  created_at?: Date;
  updated_at?: Date;
  // Associations
  options?: QuestionOption[];
}

interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
  public id!: number;
  public question_text!: string;
  public question_type!: 'mcq' | 'multiple_select' | 'true_false';
  public marks!: number;
  public correct_explanation?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  // Associations
  public options?: QuestionOption[];
}

Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    question_type: {
      type: DataTypes.ENUM('mcq', 'multiple_select', 'true_false'),
      defaultValue: 'mcq',
    },
    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    correct_explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Question',
    tableName: 'questions',
  }
);

export default Question;
