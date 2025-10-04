import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface QuestionOptionAttributes {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  created_at?: Date;
}

interface QuestionOptionCreationAttributes extends Optional<QuestionOptionAttributes, 'id' | 'created_at'> {}

class QuestionOption extends Model<QuestionOptionAttributes, QuestionOptionCreationAttributes> implements QuestionOptionAttributes {
  public id!: number;
  public question_id!: number;
  public option_text!: string;
  public is_correct!: boolean;
  public readonly created_at!: Date;
}

QuestionOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    option_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'QuestionOption',
    tableName: 'question_options',
    updatedAt: false,
  }
);

export default QuestionOption;
