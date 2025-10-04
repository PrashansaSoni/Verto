import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface QuizAttributes {
  id: number;
  name: string;
  description?: string;
  weightage: number;
  time_limit?: number;
  max_marks: number;
  cutoff: number;
  credit: number;
  max_questions: number;
  negative_marking: boolean;
  answer_release_time?: Date;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

interface QuizCreationAttributes extends Optional<QuizAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Quiz extends Model<QuizAttributes, QuizCreationAttributes> implements QuizAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public weightage!: number;
  public time_limit?: number;
  public max_marks!: number;
  public cutoff!: number;
  public credit!: number;
  public max_questions!: number;
  public negative_marking!: boolean;
  public answer_release_time?: Date;
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Quiz.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    weightage: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    time_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time limit in minutes',
    },
    max_marks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    cutoff: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    credit: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    max_questions: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      comment: 'Maximum questions to be randomly selected for each user',
    },
    negative_marking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    answer_release_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Quiz',
    tableName: 'quizzes',
  }
);

export default Quiz;
