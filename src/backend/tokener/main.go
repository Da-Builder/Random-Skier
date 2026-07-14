package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

const (
	MB  = 1000 * 1000
	MP4 = "video/mp4"
)

var (
	bucket    string
	inPrefix  string
	outPrefix string
	maxFileMB int
	presigner *s3.PresignClient
)

func handler(ctx context.Context, request events.LambdaFunctionURLRequest) (events.LambdaFunctionURLResponse, error) {
	fileSize, err := strconv.Atoi(request.QueryStringParameters["Size"])
	if err != nil || !(0 < fileSize && fileSize <= maxFileMB*MB) {
		return events.LambdaFunctionURLResponse{
			StatusCode: http.StatusBadRequest,
			Body:       fmt.Sprintf("Invalid Size: Must be 0 < Size <= %vMB", maxFileMB),
		}, nil
	}

	fileType := request.QueryStringParameters["Type"]
	if fileType != MP4 {
		return events.LambdaFunctionURLResponse{
			StatusCode: http.StatusBadRequest,
			Body:       "Invalid Type: Must be MP4",
		}, nil
	}

	fileHash := request.QueryStringParameters["Hash"]
	if fileHash == "" {
		return events.LambdaFunctionURLResponse{
			StatusCode: http.StatusBadRequest,
			Body:       "Invalid Hash: Must be Base64 Encoded MD5",
		}, nil
	}

	token := uuid.NewString()

	getRequest, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &bucket,
		Key:    new(outPrefix + token),
	})
	if err != nil {
		log.Println("Presign Get Error:", err)
		return events.LambdaFunctionURLResponse{
			StatusCode: http.StatusInternalServerError,
		}, nil
	}

	putRequest, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:        &bucket,
		Key:           new(inPrefix + token),
		ContentLength: new(int64(fileSize)),
		ContentType:   new(MP4),
		ContentMD5:    &fileHash,
	})
	if err != nil {
		log.Println("Presign Put Error:", err)
		return events.LambdaFunctionURLResponse{
			StatusCode: http.StatusInternalServerError,
		}, nil
	}

	response, err := json.Marshal(struct{ GetURL, PutURL string }{
		getRequest.URL, putRequest.URL,
	})
	if err != nil {
		log.Println("Json Marshal Error:", err)
		return events.LambdaFunctionURLResponse{
			StatusCode: http.StatusInternalServerError,
		}, nil
	}

	return events.LambdaFunctionURLResponse{
		StatusCode: http.StatusOK,
		Body:       string(response),
	}, nil
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
	mustEnvInt := func(key string) int {
		value, err := strconv.Atoi(os.Getenv(key))
		if err != nil || value <= 0 {
			crash = true
			log.Println("Require Variable:", key, "(Integer > 0)")
		}
		return value
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		crash = true
		log.Println("AWS Configuration Failed:", err)
	}

	bucket = mustEnv("Bucket")
	inPrefix = mustEnv("InPrefix")
	outPrefix = mustEnv("OutPrefix")
	maxFileMB = mustEnvInt("MaxFileMB")
	presigner = s3.NewPresignClient(
		s3.NewFromConfig(cfg),
		s3.WithPresignExpires(time.Hour*time.Duration(mustEnvInt("Expiration"))),
	)

	if crash {
		os.Exit(1)
	}

	lambda.Start(handler)
}
