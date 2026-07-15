package main

import (
	"context"
	"errors"
	"log"
	"os"
	"path"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

var (
	queue     string
	asgName   string
	asgRule   string
	sqsClient *sqs.Client
	asgClient *autoscaling.Client
)

func handler(ctx context.Context, request events.S3Event) error {
	for _, record := range request.Records {
		if _, err := sqsClient.SendMessage(ctx, &sqs.SendMessageInput{
			QueueUrl:    &queue,
			MessageBody: new(path.Base(record.S3.Object.Key)),
		}); err != nil {
			return errors.New("Queuing Error: " + err.Error())
		}

		if _, err := asgClient.ExecutePolicy(ctx, &autoscaling.ExecutePolicyInput{
			AutoScalingGroupName: &asgName,
			PolicyName:           &asgRule,
		}); err != nil {
			return errors.New("Scaling Error: " + err.Error())
		}
	}

	return nil
}

func main() {
	log.SetFlags(0)

	crash := false
	mustEnv := func(key string) string {
		value := os.Getenv(key)
		if value == "" {
			crash = true
			log.Println("Require Variable:", key)
		}
		return value
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		crash = true
		log.Println("AWS Configuration Failed:", err)
	}

	queue = mustEnv("Queue")
	asgName = mustEnv("AutoScaleName")
	asgRule = mustEnv("AutoScaleRule")
	sqsClient = sqs.NewFromConfig(cfg)
	asgClient = autoscaling.NewFromConfig(cfg)

	if crash {
		os.Exit(1)
	}

	lambda.Start(handler)
}
